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
 * Nightly command that promotes past-due unpaid records to 'overdue' status.
 * Scheduled daily at 01:00 by AccountsReceivableServiceProvider.
 *
 * IMPORTANT: days_outstanding is NO LONGER a stored column on collectibles or
 * payables. It is a computed accessor (getDaysOutstandingAttribute) on both
 * models — always accurate, never stale. This command no longer updates it.
 * For sorting by "most overdue", order by due_date ASC in queries.
 *
 * What this sweep still does:
 *   - Promotes collectibles/payables/bills/IATA payments to 'overdue' when
 *     due_date < today and the record is not already closed.
 *   - Calls recalculate() on each record which recomputes balances and sets
 *     the auto-status correctly.
 *   - Notifies the disbursement_officer role when records flip to overdue.
 *
 * Collectible note: recalculate() will NOT override MANUAL_STATUSES
 * (ibayad, blocking, query, cancelled) — those are intentionally preserved.
 */
class SweepOverdue extends Command
{
    protected $signature = 'finance:sweep-overdue
                            {--dry-run : Log what would change without saving}';

    protected $description = 'Mark all past-due unpaid records as overdue.';

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
        // Exclude MANUAL_STATUSES — recalculate() won't touch them anyway,
        // but skipping them here avoids unnecessary DB reads.
        Collectible::query()
            ->where('due_date', '<', $today)
            ->whereNotIn('status', array_merge(
                Collectible::CLOSED_STATUSES,
                Collectible::MANUAL_STATUSES,
                ['overdue']
            ))
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
            ->whereNotIn('status', ['paid', 'filed', 'overdue'])
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
            ->whereNotIn('status', ['paid', 'cancelled', 'overdue'])
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
            ->whereNotIn('status', ['paid', 'cancelled', 'overdue'])
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
