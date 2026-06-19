<?php

namespace Modules\IataPayments\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\IataPayments\Models\IataPayment;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'accounting_assistant', 'general_sales_manager', 'liaison_officer_finance'])) {
            return;
        }

        $query = IataPayment::query();

        $collector->addCard('finance', 'Finance', 'IATA payments', $query->count(), 'Building2', 'primary', href: '/iata');

        // Count pending+overdue payments using due_date logic so the figure is
        // never stale. We count all unpaid records here so both "pending" and
        // "overdue" (past-due-but-not-yet-swept) are included.
        $collector->addAttention(
            'finance', 'Finance', 'IATA pending',
            (clone $query)->where('status', '!=', 'paid')->count(),
            'warning', '/iata'
        );
    }
}
