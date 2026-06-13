<?php

namespace Modules\AccountsReceivable\Console\Commands;

use Illuminate\Console\Command;
use Modules\AccountsPayable\Models\Payable;
use Modules\AccountsReceivable\Models\Collectible;
use Modules\BillsMonitoring\Models\Bill;
use Modules\IataPayments\Models\IataPayment;
use Modules\Notifications\Services\NotificationDispatcher;

/**
 * SweepOverdue
 *
 * Phase 4b — Nightly Overdue Sweep Command.
 * Scheduled daily at 01:00 by AccountsReceivableServiceProvider::configureSchedules().
 *
 * Finds all records across the four finance tables (Collectibles, Payables,
 * Bills, IataPayments) where:
 *   - due_date < today
 *   - status is not 'paid', 'refunded', 'filed', or 'cancelled'
 *
 * Updates the stored status column to 'overdue' and recalculates days_outstanding
 * so that raw SQL reports, CSV exports, and any future tools that read the column
 * directly always reflect the correct state without a manual re-save.
 *
 * Collectible and Payable delegate to their own recalculate() method.
 * Bill and IataPayment have recalculate() added in Phase 4b.
 *
 * After sweeping, dispatches a single batched WorkflowNotification to the
 * disbursement_officer role listing how many records became overdue today.
 * This notification is only sent when at least one record flipped — no noise
 * on quiet nights.
 */
class SweepOverdue extends Command
{
    protected $signature = 'finance:sweep-overdue
                            {--dry-run : Log what would change without saving}';

    protected $description = 'Mark all past-due unpaid records as overdue and update days_outstanding.';

    public function __construct(private readonly NotificationDispatcher $dispatcher)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $today  = now()->toDateString();

        $counts = [
            'collectibles'  => 0,
            'payables'      => 0,
            'bills'         => 0,
            'iata_payments' => 0,
        ];

        // ── Collectibles ──────────────────────────────────────────────────
        Collectible::query()
            ->where('due_date', '<', $today)
            ->whereNotIn('status', ['paid', 'refunded', 'cancelled'])
            ->where('status', '!=', 'overdue')
            ->each(function (Collectible $record) use ($dryRun, &$counts) {
                $this->line("  Collectible #{$record->id} — {$record->customer_name}");

                if (! $dryRun) {
                    $record->recalculate();
                    $record->save();
                }

                $counts['collectibles']++;
            });

        // ── Payables ──────────────────────────────────────────────────────
        Payable::query()
            ->where('due_date', '<', $today)
            ->whereNotIn('status', ['paid', 'filed', 'cancelled'])
            ->where('status', '!=', 'overdue')
            ->each(function (Payable $record) use ($dryRun, &$counts) {
                $this->line("  Payable #{$record->id} — {$record->supplier_name}");

                if (! $dryRun) {
                    $record->recalculate();
                    $record->save();
                }

                $counts['payables']++;
            });

        // ── Bills ─────────────────────────────────────────────────────────
        Bill::query()
            ->where('due_date', '<', $today)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->where('status', '!=', 'overdue')
            ->each(function (Bill $record) use ($dryRun, &$counts) {
                $this->line("  Bill #{$record->id} — {$record->name}");

                if (! $dryRun) {
                    $record->recalculate();
                    $record->save();
                }

                $counts['bills']++;
            });

        // ── IATA Payments ─────────────────────────────────────────────────
        IataPayment::query()
            ->where('due_date', '<', $today)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->where('status', '!=', 'overdue')
            ->each(function (IataPayment $record) use ($dryRun, &$counts) {
                $this->line("  IATA Payment #{$record->id} — {$record->operator_name}");

                if (! $dryRun) {
                    $record->recalculate();
                    $record->save();
                }

                $counts['iata_payments']++;
            });

        // ── Summary ───────────────────────────────────────────────────────
        $total = array_sum($counts);

        if ($total === 0) {
            $this->info('No newly-overdue records. Nothing to sweep.');

            return self::SUCCESS;
        }

        $label = $dryRun ? '[DRY RUN] Would mark overdue' : 'Marked overdue';

        $this->info(sprintf(
            "%s: %d collectible(s), %d payable(s), %d bill(s), %d IATA payment(s).",
            $label,
            $counts['collectibles'],
            $counts['payables'],
            $counts['bills'],
            $counts['iata_payments'],
        ));

        // Notify disbursement officer (skipped on dry-run)
        if (! $dryRun) {
            $parts = [];
            if ($counts['collectibles']) {
                $parts[] = "{$counts['collectibles']} receivable(s)";
            }
            if ($counts['payables']) {
                $parts[] = "{$counts['payables']} payable(s)";
            }
            if ($counts['bills']) {
                $parts[] = "{$counts['bills']} bill(s)";
            }
            if ($counts['iata_payments']) {
                $parts[] = "{$counts['iata_payments']} IATA payment(s)";
            }

            $this->dispatcher->notifyRoles(
                roles: ['disbursement_officer'],
                title: 'Overdue Records Detected',
                message: sprintf(
                    '%d record(s) passed their due date overnight: %s. Please review.',
                    $total,
                    implode(', ', $parts),
                ),
                url: '/finance/accounts-payable',
                level: 'warning',
            );
        }

        return self::SUCCESS;
    }
}
