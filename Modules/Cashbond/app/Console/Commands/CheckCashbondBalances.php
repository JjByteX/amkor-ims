<?php

namespace Modules\Cashbond\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Modules\Cashbond\Models\CashbondPortal;
use Modules\Notifications\Services\NotificationDispatcher;

/**
 * CheckCashbondBalances
 *
 * Phase 12 — Cashbond Low-Balance Alert.
 * Scheduled daily at 08:00 by CashbondServiceProvider::configureSchedules().
 *
 * Finds all active cashbond portals where current_balance < maintaining_balance
 * and notifies the disbursement officer for each one.
 *
 * A per-portal cooldown prevents repeat alerts on the same calendar day:
 * once a portal has triggered a notification today, it is silenced until
 * midnight, even if the command re-runs (e.g. during testing or manual runs).
 *
 * No alert is sent on days when the balance is already back above the threshold —
 * normal operation is quiet.
 */
class CheckCashbondBalances extends Command
{
    protected $signature = 'finance:check-cashbond-balances
                            {--dry-run : Log alerts without sending notifications}';

    protected $description = 'Alert disbursement officer when cashbond portal balances drop below their maintaining threshold.';

    public function __construct(private readonly NotificationDispatcher $dispatcher)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $portals = CashbondPortal::active()
            ->belowThreshold()
            ->get();

        if ($portals->isEmpty()) {
            $this->info('All cashbond balances are above threshold. Nothing to alert.');

            return self::SUCCESS;
        }

        $alerted = 0;
        $skipped = 0;

        foreach ($portals as $portal) {
            $cooldownKey = "cashbond_alert_sent:{$portal->id}:" . now()->toDateString();

            // Cooldown guard — no repeated alerts for the same portal on the same day
            if (Cache::has($cooldownKey)) {
                $this->line("  Skipping portal #{$portal->id} \"{$portal->name}\" — already alerted today.");
                $skipped++;

                continue;
            }

            $this->line(sprintf(
                "  Portal #%d \"%s\" — balance ₱%s is below maintaining threshold ₱%s",
                $portal->id,
                $portal->name,
                number_format($portal->current_balance, 2),
                number_format($portal->maintaining_balance, 2),
            ));

            if (! $dryRun) {
                $this->dispatcher->notifyRoles(
                    roles: ['disbursement_officer'],
                    title: "Low Cashbond Balance: {$portal->name}",
                    message: sprintf(
                        'The cashbond portal "%s" has a current balance of ₱%s, which is below the maintaining balance of ₱%s. Please arrange a reload.',
                        $portal->name,
                        number_format($portal->current_balance, 2),
                        number_format($portal->maintaining_balance, 2),
                    ),
                    url: '/cashbond',
                    level: 'warning',
                );

                // Mark as alerted for the rest of today (expires at midnight)
                $secondsUntilMidnight = now()->secondsUntilEndOfDay() + 1;
                Cache::put($cooldownKey, true, $secondsUntilMidnight);
            }

            $alerted++;
        }

        $label = $dryRun ? '[DRY RUN] Would alert' : 'Alerted';

        $this->info(sprintf(
            '%s disbursement officer for %d portal(s). %d skipped (already alerted today).',
            $label,
            $alerted,
            $skipped,
        ));

        return self::SUCCESS;
    }
}
