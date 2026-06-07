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
        $collector->addAttention('finance', 'Finance', 'Pending payables', (clone $query)->whereIn('status', ['pending', 'overdue'])->count(), 'warning', '/payables');
    }
}
