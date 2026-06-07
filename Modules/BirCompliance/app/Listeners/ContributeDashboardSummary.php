<?php

namespace Modules\BirCompliance\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\BirCompliance\Models\BirTransaction;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'disbursement_officer', 'accounting_officer', 'admin_auditor'])) {
            return;
        }

        $query = BirTransaction::query();

        $collector->addCard('finance', 'Finance', 'BIR records', $query->count(), 'ClipboardCheck', 'default', href: '/bir');
        $collector->addCard('finance', 'Finance', 'Net amount due', 'PHP '.number_format((float) (clone $query)->sum('net_amount_due'), 2), 'ReceiptText', 'success', href: '/bir');
    }
}
