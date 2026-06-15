<?php

namespace Modules\Disbursement\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Modules\Notifications\Services\NotificationDispatcher;

/**
 * SendAccessFilesReminder
 *
 * Confirmed client requirement (ground truth from Dalle's workflow):
 *   "Sends access files to Admin Auditor every 15th and end of month."
 *
 * This command fires on two calendar events per month:
 *   - The 15th  (mid-month access-files dispatch)
 *   - The last day of the month  (end-of-month access-files dispatch)
 *
 * It is registered in DisbursementServiceProvider and scheduled via
 * configureSchedules() to run dailyAt('07:45') — slotted after the BIR
 * reminder (07:30) and before the Cashbond balance check (08:00).
 * On non-trigger days the command exits immediately with no side effects.
 *
 * A per-event Cache cooldown prevents duplicate alerts when the scheduler
 * or a developer runs the command more than once on a trigger day.
 *
 * Options:
 *   --dry-run   Log what would fire without sending any notifications.
 *   --date=     Override today's date (YYYY-MM-DD) for testing.
 *               Example: php artisan disbursement:send-access-files-reminder --date=2026-06-30
 */
class SendAccessFilesReminder extends Command
{
    protected $signature = 'disbursement:send-access-files-reminder
                            {--dry-run : Log what would fire without sending notifications}
                            {--date=   : Override today\'s date (YYYY-MM-DD) for testing}';

    protected $description = 'Remind the Admin Auditor to send/receive access files on the 15th and last day of each month.';

    public function __construct(private readonly NotificationDispatcher $dispatcher)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $today = $this->option('date')
            ? Carbon::parse($this->option('date'))->startOfDay()
            : now()->startOfDay();

        $day         = (int) $today->day;
        $lastDayOfMonth = (int) $today->copy()->endOfMonth()->day;

        $isMidMonth  = ($day === 15);
        $isEndOfMonth = ($day === $lastDayOfMonth);

        if (! $isMidMonth && ! $isEndOfMonth) {
            $this->line("Today ({$today->toDateString()}) is not a trigger day. Nothing to do.");
            return self::SUCCESS;
        }

        $label        = $isMidMonth ? 'mid-month (15th)' : 'end-of-month';
        $cooldownKey  = 'disbursement:access_files_reminder:' . $today->toDateString();

        if (Cache::has($cooldownKey)) {
            $this->line("Access-files reminder already sent today ({$today->toDateString()}). Skipping.");
            return self::SUCCESS;
        }

        $title   = "📂 Access Files — {$today->format('F Y')} ({$label})";
        $message = $this->buildMessage($today, $label);
        $url     = '/disbursement';

        $this->info("Trigger: {$label} — {$today->toDateString()}");
        $this->line("  → {$title}");

        if (! $dryRun) {
            $this->dispatcher->notifyRoles(
                roles:   ['admin_auditor', 'disbursement_officer'],
                title:   $title,
                message: $message,
                url:     $url,
                level:   'info',
            );

            // Cooldown until end of day — prevents duplicate sends on re-runs
            Cache::put($cooldownKey, true, now()->secondsUntilEndOfDay() + 1);

            $this->info('Notification sent to admin_auditor and disbursement_officer.');
        } else {
            $this->warn('[DRY RUN] Would send the above notification — no actual dispatch performed.');
        }

        return self::SUCCESS;
    }

    /**
     * Build the notification message body.
     */
    private function buildMessage(Carbon $today, string $label): string
    {
        $period = $today->format('F Y');

        $lines = [
            "This is your {$label} reminder to send the disbursement access files to the Admin Auditor.",
            '',
            "Period : {$period}",
            "Due    : Today ({$today->format('l, F d, Y')})",
            '',
            'Steps:',
            '  1. Export the disbursement access files for this period from the Disbursement module.',
            '  2. Send the exported files to the Admin Auditor (admin_auditor role).',
            '  3. Mark the dispatch as completed in your records.',
            '',
            '→ Disbursement: /disbursement',
        ];

        return implode("\n", $lines);
    }
}
