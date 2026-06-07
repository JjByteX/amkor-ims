<?php

namespace Modules\AccountsReceivable\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\AccountsReceivable\Models\Collectible;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer'])) {
            return;
        }

        $query = Collectible::query();

        $collector->addCard('finance', 'Finance', 'Receivable balance', 'PHP '.number_format((float) (clone $query)->sum('balance_php'), 2), 'ReceiptText', 'error', href: '/ar');
        $collector->addAttention('finance', 'Finance', 'Open receivables', (clone $query)->whereNotIn('status', ['paid', 'refunded'])->count(), 'warning', '/ar');
    }
}
