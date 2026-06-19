<?php

namespace Modules\AccountsReceivable\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\AccountsReceivable\Models\Collectible;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'general_sales_manager', 'accounting_assistant', 'sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer', 'branch_supervisor', 'visa_documentation_supervisor'])) {
            return;
        }

        $query = Collectible::query();

        $collector->addCard('finance', 'Finance', 'Receivable balance', 'PHP '.number_format((float) (clone $query)->sum('balance_php'), 2), 'ReceiptText', 'error', href: '/ar');

        // Count open receivables using a whereNotIn rather than a stored-status
        // filter so the figure is always current regardless of the sweep.
        $collector->addAttention(
            'finance', 'Finance', 'Open receivables',
            (clone $query)->whereNotIn('status', ['paid', 'refunded'])->count(),
            'warning', '/ar'
        );
    }
}
