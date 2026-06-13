<?php

namespace Modules\AccountsPayable\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\AccountsPayable\Models\Payable;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'accounting_officer', 'disbursement_officer', 'admin_auditor'])) {
            return;
        }

        $query = Payable::query();

        $collector->addCard('finance', 'Finance', 'Payables', $query->count(), 'Landmark', 'primary', href: '/payables');
        $collector->addCard('finance', 'Finance', 'Payable balance', 'PHP '.number_format((float) (clone $query)->sum('balance_php'), 2), 'BanknoteArrowDown', 'warning', href: '/payables');

        // Count unpaid records using computed due-date logic so the figure is
        // always correct regardless of whether the stored status column has been
        // swept yet.  "Pending" = not yet due; "overdue" = past due — both are
        // unresolved, so we count everything that is not paid or filed.
        $collector->addAttention(
            'finance', 'Finance', 'Pending payables',
            (clone $query)->whereNotIn('status', ['paid', 'filed'])->count(),
            'warning', '/payables'
        );
    }
}
