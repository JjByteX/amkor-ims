<?php

namespace Modules\BillsMonitoring\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\BillsMonitoring\Models\Bill;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'accounting_assistant', 'liaison_officer_finance'])) {
            return;
        }

        $query = Bill::query();

        $collector->addCard('finance', 'Finance', 'Bills', $query->count(), 'Files', 'default', href: '/bills');

        // "Pending" count: not yet due and not paid.
        // Uses the actual due_date so it never reads from a potentially stale
        // stored status column.
        $collector->addAttention(
            'finance', 'Finance', 'Bills pending',
            (clone $query)->where('status', '!=', 'paid')
                ->where(function ($q) {
                    $q->whereNull('due_date')
                        ->orWhere('due_date', '>=', now()->toDateString());
                })->count(),
            'warning', '/bills'
        );

        // "Overdue" count: past due_date and not paid — always accurate.
        $collector->addAttention(
            'finance', 'Finance', 'Bills overdue',
            (clone $query)->effectivelyOverdue()->count(),
            'error', '/bills'
        );
    }
}
