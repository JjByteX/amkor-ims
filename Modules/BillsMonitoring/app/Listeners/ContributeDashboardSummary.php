<?php

namespace Modules\BillsMonitoring\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\BillsMonitoring\Models\Bill;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'hr_admin_officer', 'disbursement_officer', 'admin_auditor'])) {
            return;
        }

        $query = Bill::query();

        $collector->addCard('finance', 'Finance', 'Bills', $query->count(), 'Files', 'default', href: '/bills');
        $collector->addAttention('finance', 'Finance', 'Bills pending', (clone $query)->where('status', 'pending')->count(), 'warning', '/bills');
        $collector->addAttention('finance', 'Finance', 'Bills overdue', (clone $query)->where('status', 'overdue')->count(), 'error', '/bills');
    }
}
