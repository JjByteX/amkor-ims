<?php

namespace Modules\SalesSummary\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\SalesSummary\Models\SalesTarget;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer'])) {
            return;
        }

        $collector->addCard('operations', 'Operations', 'Sales targets', SalesTarget::query()->count(), 'Target', 'default', href: '/sales');
    }
}
