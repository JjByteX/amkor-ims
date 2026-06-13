<?php

namespace Modules\BirCompliance\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Modules\Notifications\Services\NotificationDispatcher;

/**
 * SendBirDeadlineReminders
 *
 * Phase 15 — BIR Deadline Reminders.
 * Scheduled daily at 07:30 by BirComplianceServiceProvider::configureSchedules().
 *
 * Checks whether today falls within a reminder window before any known BIR
 * filing deadline and notifies the accounting_officer role. The reminder
 * includes the deadline date, the filing type, and a direct link to the
 * BIR monthly export page so they can generate the required file immediately.
 *
 * BIR filing schedule for VAT-registered businesses (Philippines):
 *
 *   Monthly VAT (BIR Form 2550M)   — due on the 20th of the following month
 *   Quarterly VAT (BIR Form 2550Q) — due on the 25th of the month after quarter-end
 *   Quarterly Income Tax:
 *     Q1 (BIR Form 1702Q)          — due 60 days after quarter-end (May 29 approx.)
 *     Q2 (BIR Form 1702Q)          — due 60 days after quarter-end (Aug 29 approx.)
 *     Q3 (BIR Form 1702Q)          — due 60 days after quarter-end (Nov 29 approx.)
 *   Annual Income Tax (BIR Form 1702-RT) — due April 15
 *
 * Reminders fire at:
 *   - 7 days before deadline  (first heads-up)
 *   - 3 days before deadline  (urgent)
 *   - 1 day  before deadline  (final warning)
 *
 * Per-deadline-per-window cooldown via Cache prevents duplicate alerts when
 * the command runs multiple times in a day (e.g. during testing or re-runs).
 *
 * The --dry-run flag logs what would fire without sending any notifications.
 */
class SendBirDeadlineReminders extends Command
{
    protected $signature = 'finance:bir-deadline-reminders
                            {--dry-run : Log reminders without sending notifications}
                            {--date=  : Override today\'s date (YYYY-MM-DD) for testing}';

    protected $description = 'Notify the accounting officer before upcoming BIR filing deadlines.';

    /** Reminder lead times in days — earliest to latest */
    private const REMINDER_DAYS = [7, 3, 1];

    public function __construct(private readonly NotificationDispatcher $dispatcher)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $today  = $this->option('date')
            ? \Carbon\Carbon::parse($this->option('date'))
            : now()->startOfDay();

        $deadlines = $this->buildDeadlines($today->year, $today->month);

        $fired   = 0;
        $skipped = 0;

        foreach ($deadlines as ['label' => $label, 'date' => $deadline, 'type' => $type]) {
            $daysUntil = (int) $today->diffInDays($deadline, false);

            if (! in_array($daysUntil, self::REMINDER_DAYS, true)) {
                continue;
            }

            $cooldownKey = 'bir_reminder:'
                . $deadline->toDateString()
                . ':' . $type
                . ':' . $daysUntil . 'd';

            if (Cache::has($cooldownKey)) {
                $this->line("  Skipping [{$label}] {$daysUntil}d reminder — already sent today.");
                $skipped++;
                continue;
            }

            $urgency = match ($daysUntil) {
                1 => '⚠️ FINAL REMINDER',
                3 => '🔔 Reminder',
                default => 'Upcoming',
            };

            $title   = "{$urgency}: {$label} due {$deadline->format('M d, Y')}";
            $message = $this->buildMessage($label, $deadline, $daysUntil);
            $url     = '/bir/transactions';

            $this->line("  [{$label}] {$daysUntil}d before {$deadline->toDateString()} — {$title}");

            if (! $dryRun) {
                $level = $daysUntil === 1 ? 'error' : ($daysUntil === 3 ? 'warning' : 'info');

                $this->dispatcher->notifyRoles(
                    roles: ['accounting_officer', 'general_manager'],
                    title: $title,
                    message: $message,
                    url: $url,
                    level: $level,
                );

                // Cooldown until end of day — prevents re-firing on manual re-runs
                $secondsUntilMidnight = now()->secondsUntilEndOfDay() + 1;
                Cache::put($cooldownKey, true, $secondsUntilMidnight);
            }

            $fired++;
        }

        $label = $dryRun ? '[DRY RUN] Would fire' : 'Fired';
        $this->info("{$label} {$fired} reminder(s). {$skipped} skipped (already sent today).");

        return self::SUCCESS;
    }

    /**
     * Build the list of BIR deadlines relevant to the current month window.
     *
     * Generates deadlines for the current month and the next month so we
     * never miss a deadline that falls just after month rollover.
     *
     * @return array<int, array{label: string, date: \Carbon\Carbon, type: string}>
     */
    private function buildDeadlines(int $year, int $month): array
    {
        $deadlines = [];

        // Generate for current month and next month to catch cross-month reminders
        foreach ([0, 1] as $offset) {
            $ref = \Carbon\Carbon::create($year, $month, 1)->addMonths($offset);
            $y   = $ref->year;
            $m   = $ref->month;

            // ── Monthly VAT (2550M) ────────────────────────────────────────────
            // Filed on or before the 20th of the month following the taxable month.
            // e.g. January transactions → due February 20.
            $priorMonth = \Carbon\Carbon::create($y, $m, 1)->subMonth();
            $deadlines[] = [
                'label' => sprintf(
                    'Monthly VAT (2550M) — %s %d',
                    $priorMonth->format('F'),
                    $priorMonth->year,
                ),
                'date'  => \Carbon\Carbon::create($y, $m, 20)->startOfDay(),
                'type'  => '2550M_' . $priorMonth->format('Ym'),
            ];

            // ── Quarterly VAT (2550Q) ──────────────────────────────────────────
            // Filed on or before the 25th of the month following the end of each quarter.
            // Quarter-ends: March (→ due Apr 25), June (→ Jul 25), Sept (→ Oct 25), Dec (→ Jan 25).
            $quarterlyDueMonths = [4 => 'Q1 (Jan–Mar)', 7 => 'Q2 (Apr–Jun)', 10 => 'Q3 (Jul–Sep)', 1 => 'Q4 (Oct–Dec)'];
            if (isset($quarterlyDueMonths[$m])) {
                $dueYear = ($m === 1) ? $y : $y; // Jan 25 of following year is handled by offset loop
                $deadlines[] = [
                    'label' => sprintf('Quarterly VAT (2550Q) — %s %d', $quarterlyDueMonths[$m], $y),
                    'date'  => \Carbon\Carbon::create($dueYear, $m, 25)->startOfDay(),
                    'type'  => '2550Q_' . $y . '_' . $m,
                ];
            }

            // ── Quarterly Income Tax (1702Q) ───────────────────────────────────
            // Due 60 days after the close of each quarter.
            // Q1 ends Mar 31 → due May 29 (or May 30 leap year)
            // Q2 ends Jun 30 → due Aug 29
            // Q3 ends Sep 30 → due Nov 29
            // No Q4 filing — covered by the Annual return.
            $quarterlyItDues = [
                5  => ['label' => 'Quarterly Income Tax (1702Q) — Q1', 'day' => 29],
                8  => ['label' => 'Quarterly Income Tax (1702Q) — Q2', 'day' => 29],
                11 => ['label' => 'Quarterly Income Tax (1702Q) — Q3', 'day' => 29],
            ];
            if (isset($quarterlyItDues[$m])) {
                $deadlines[] = [
                    'label' => $quarterlyItDues[$m]['label'] . ' ' . $y,
                    'date'  => \Carbon\Carbon::create($y, $m, $quarterlyItDues[$m]['day'])->startOfDay(),
                    'type'  => '1702Q_' . $y . '_' . $m,
                ];
            }

            // ── Annual Income Tax (1702-RT) ────────────────────────────────────
            // Due April 15 of the following year.
            if ($m === 4) {
                $deadlines[] = [
                    'label' => "Annual Income Tax (1702-RT) — FY " . ($y - 1),
                    'date'  => \Carbon\Carbon::create($y, 4, 15)->startOfDay(),
                    'type'  => '1702RT_' . $y,
                ];
            }
        }

        return $deadlines;
    }

    /**
     * Build the notification message body for a given deadline.
     */
    private function buildMessage(string $label, \Carbon\Carbon $deadline, int $daysUntil): string
    {
        $dayWord = $daysUntil === 1 ? 'tomorrow' : "in {$daysUntil} days";

        $lines = [
            "The BIR filing deadline for \"{$label}\" is {$dayWord} ({$deadline->format('l, F d, Y')}).",
            '',
            'Go to the BIR Transactions page to generate the monthly export and prepare your filing:',
            '→ BIR Transactions: /bir/transactions',
        ];

        if ($daysUntil === 1) {
            $lines[] = '';
            $lines[] = 'This is your final reminder. Penalties apply for late filing.';
        }

        return implode("\n", $lines);
    }
}
