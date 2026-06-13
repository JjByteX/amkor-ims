<?php

namespace Modules\CreditCardMonitoring\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Modules\CreditCardMonitoring\Models\CreditCard;
use Modules\CreditCardMonitoring\Models\CreditCardPayment;
use Modules\Notifications\Services\NotificationDispatcher;

/**
 * CreditCardMonthly
 *
 * Phases 11 + 13 — Credit Card Cycle Auto-Creation & Reminders (merged).
 * Scheduled daily by CreditCardMonitoringServiceProvider::configureSchedules().
 *
 * Runs three jobs in a single pass:
 *
 *   1. Monthly record creation (runs on the 1st of every month)
 *      For each active credit card, creates a new `credit_card_payments` row
 *      for the current month using `due_day` to compute the due date.
 *      Guards against duplicates: if a record already exists for this card in
 *      this month it is silently skipped, so the command is safe to re-run.
 *
 *   2. Statement cut-off reminder (fires 3 days before statement_cut_off day)
 *      Notifies the disbursement officer that the billing cycle is about to
 *      close for the card. Officers should avoid large charges after cut-off.
 *
 *   3. Payment due reminder (fires 5 days before due_day)
 *      Notifies the disbursement officer that a CC payment is coming up so
 *      they can prepare the check voucher and get it through the approval chain
 *      before the actual due date.
 *
 * Cards without a due_day set are skipped for record creation (no date to use).
 * Cards without a statement_cut_off set are skipped for the cut-off reminder.
 * Per-card cooldowns prevent duplicate reminder notifications on the same day.
 *
 * --dry-run logs all actions without writing to the DB or sending notifications.
 */
class CreditCardMonthly extends Command
{
    protected $signature = 'finance:cc-monthly
                            {--dry-run : Log all actions without saving records or sending notifications}';

    protected $description = 'Auto-create monthly CC payment records and send cut-off / due-date reminders.';

    /** Days before statement cut-off to send the cut-off reminder. */
    private const CUTOFF_REMINDER_DAYS = 3;

    /** Days before payment due day to send the payment reminder. */
    private const DUE_REMINDER_DAYS = 5;

    public function __construct(private readonly NotificationDispatcher $dispatcher)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $today  = now();

        $cards = CreditCard::active()->get();

        if ($cards->isEmpty()) {
            $this->info('No active credit cards found. Nothing to do.');

            return self::SUCCESS;
        }

        $created  = 0;
        $reminded = 0;

        foreach ($cards as $card) {
            $label = "\"{$card->card_name}\"" . ($card->last_four ? " (****{$card->last_four})" : '');

            // ── 1. Monthly record creation ────────────────────────────────
            if ($today->day === 1) {
                $created += $this->maybeCreateMonthlyRecord($card, $today, $dryRun, $label);
            }

            // ── 2. Statement cut-off reminder ─────────────────────────────
            if ($card->statement_cut_off) {
                $reminded += $this->maybeSendCutoffReminder($card, $today, $dryRun, $label);
            }

            // ── 3. Payment due reminder ───────────────────────────────────
            if ($card->due_day) {
                $reminded += $this->maybeSendDueReminder($card, $today, $dryRun, $label);
            }
        }

        $prefix = $dryRun ? '[DRY RUN] ' : '';

        $this->info(sprintf(
            '%sFinished. %d payment record(s) created, %d reminder(s) sent.',
            $prefix,
            $created,
            $reminded,
        ));

        return self::SUCCESS;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a monthly payment record for the card if one does not already
     * exist for the current month/year.
     *
     * Returns 1 if a record was (or would be) created, 0 otherwise.
     */
    private function maybeCreateMonthlyRecord(
        CreditCard $card,
        Carbon $today,
        bool $dryRun,
        string $label,
    ): int {
        if (! $card->due_day) {
            $this->line("  Skip monthly record for {$label} — no due_day configured.");

            return 0;
        }

        $year  = $today->year;
        $month = $today->month;

        // Guard against duplicates
        $exists = CreditCardPayment::where('credit_card_id', $card->id)
            ->whereYear('due_date', $year)
            ->whereMonth('due_date', $month)
            ->exists();

        if ($exists) {
            $this->line("  Skip monthly record for {$label} — record already exists for {$year}-{$month}.");

            return 0;
        }

        // Build the due date, clamping to the last day of the month when
        // due_day exceeds it (e.g. day 31 in February → Feb 28/29).
        $dueDate = $this->safeDayOfMonth($year, $month, $card->due_day);

        // Build the statement date using statement_cut_off if available.
        // Statement cut-off is in the same month as the due date.
        $statementDate = $card->statement_cut_off
            ? $this->safeDayOfMonth($year, $month, $card->statement_cut_off)
            : null;

        $this->line(sprintf(
            '  Creating monthly record for %s — due %s%s',
            $label,
            $dueDate->toDateString(),
            $statementDate ? ", statement {$statementDate->toDateString()}" : '',
        ));

        if (! $dryRun) {
            CreditCardPayment::create([
                'credit_card_id' => $card->id,
                'payment_no'     => CreditCardPayment::nextNumber(),
                'amount'         => 0.00,           // Amount unknown until statement arrives
                'due_date'       => $dueDate->toDateString(),
                'statement_date' => $statementDate?->toDateString(),
                'status'         => 'pending',
                'approval_status'=> 'pending',
                'remarks'        => 'Auto-created by finance:cc-monthly on ' . now()->toDateString(),
                'created_by'     => null,
                'updated_by'     => null,
            ]);
        }

        return 1;
    }

    /**
     * Send a statement cut-off reminder if today is exactly CUTOFF_REMINDER_DAYS
     * before the card's statement_cut_off day.
     *
     * Returns 1 if a notification was (or would be) sent, 0 otherwise.
     */
    private function maybeSendCutoffReminder(
        CreditCard $card,
        Carbon $today,
        bool $dryRun,
        string $label,
    ): int {
        $cutoffThisMonth = $this->safeDayOfMonth($today->year, $today->month, $card->statement_cut_off);
        $reminderDay     = $cutoffThisMonth->copy()->subDays(self::CUTOFF_REMINDER_DAYS);

        if (! $today->isSameDay($reminderDay)) {
            return 0;
        }

        $cooldownKey = "cc_cutoff_reminder:{$card->id}:{$today->toDateString()}";

        if (Cache::has($cooldownKey)) {
            $this->line("  Skip cut-off reminder for {$label} — already sent today.");

            return 0;
        }

        $this->line(sprintf(
            '  Cut-off reminder for %s — statement cut-off in %d days (%s).',
            $label,
            self::CUTOFF_REMINDER_DAYS,
            $cutoffThisMonth->toDateString(),
        ));

        if (! $dryRun) {
            $this->dispatcher->notifyRoles(
                roles: ['disbursement_officer'],
                title: "CC Statement Cut-Off in " . self::CUTOFF_REMINDER_DAYS . " Days: {$card->card_name}",
                message: sprintf(
                    'The billing cycle for %s closes on %s (%d days from now). '
                    . 'Avoid large charges after cut-off to keep the next bill manageable.',
                    $label,
                    $cutoffThisMonth->format('F j, Y'),
                    self::CUTOFF_REMINDER_DAYS,
                ),
                url: '/credit-cards',
                level: 'info',
            );

            $secondsUntilMidnight = now()->secondsUntilEndOfDay() + 1;
            Cache::put($cooldownKey, true, $secondsUntilMidnight);
        }

        return 1;
    }

    /**
     * Send a payment due reminder if today is exactly DUE_REMINDER_DAYS
     * before the card's due_day this month.
     *
     * Returns 1 if a notification was (or would be) sent, 0 otherwise.
     */
    private function maybeSendDueReminder(
        CreditCard $card,
        Carbon $today,
        bool $dryRun,
        string $label,
    ): int {
        $dueThisMonth = $this->safeDayOfMonth($today->year, $today->month, $card->due_day);
        $reminderDay  = $dueThisMonth->copy()->subDays(self::DUE_REMINDER_DAYS);

        if (! $today->isSameDay($reminderDay)) {
            return 0;
        }

        $cooldownKey = "cc_due_reminder:{$card->id}:{$today->toDateString()}";

        if (Cache::has($cooldownKey)) {
            $this->line("  Skip due reminder for {$label} — already sent today.");

            return 0;
        }

        // Look up the current month's payment record for the estimated amount.
        $payment = CreditCardPayment::where('credit_card_id', $card->id)
            ->whereYear('due_date', $today->year)
            ->whereMonth('due_date', $today->month)
            ->first();

        $amountNote = ($payment && $payment->amount > 0)
            ? sprintf(' Estimated amount: ₱%s.', number_format($payment->amount, 2))
            : ' Amount not yet recorded — update the payment record once the statement arrives.';

        $this->line(sprintf(
            '  Due reminder for %s — payment due in %d days (%s).%s',
            $label,
            self::DUE_REMINDER_DAYS,
            $dueThisMonth->toDateString(),
            $amountNote,
        ));

        if (! $dryRun) {
            $this->dispatcher->notifyRoles(
                roles: ['disbursement_officer'],
                title: "CC Payment Due in " . self::DUE_REMINDER_DAYS . " Days: {$card->card_name}",
                message: sprintf(
                    'Payment for %s is due on %s (%d days from now).%s '
                    . 'Please prepare the check voucher and route it for approval.',
                    $label,
                    $dueThisMonth->format('F j, Y'),
                    self::DUE_REMINDER_DAYS,
                    $amountNote,
                ),
                url: '/credit-cards',
                level: 'warning',
            );

            $secondsUntilMidnight = now()->secondsUntilEndOfDay() + 1;
            Cache::put($cooldownKey, true, $secondsUntilMidnight);
        }

        return 1;
    }

    /**
     * Build a Carbon date for a specific day-of-month, clamping to the last
     * valid day when `$day` exceeds the month's length (e.g. day 31 in April).
     */
    private function safeDayOfMonth(int $year, int $month, int $day): Carbon
    {
        $lastDay = Carbon::create($year, $month, 1)->daysInMonth;

        return Carbon::create($year, $month, min($day, $lastDay));
    }
}
