<?php

namespace Modules\IataPayments\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\IataPayments\Models\IataPayment;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'disbursement_officer', 'admin_auditor'])) {
            return;
        }

        $query = IataPayment::query();

        $collector->addCard('finance', 'Finance', 'IATA payments', $query->count(), 'Building2', 'primary', href: '/iata');
        $collector->addAttention('finance', 'Finance', 'IATA pending', (clone $query)->where('status', 'pending')->count(), 'warning', '/iata');
    }
}
