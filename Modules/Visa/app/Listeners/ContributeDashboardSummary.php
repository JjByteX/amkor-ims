<?php

namespace Modules\Visa\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Visa\Models\VisaApplication;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'visa_documentation_officer', 'disbursement_officer', 'admin_auditor'])) {
            return;
        }

        $query = VisaApplication::query();

        $collector->addCard('operations', 'Operations', 'Visa applications', $query->count(), 'FileCheck2', 'info', href: '/visa');
        $collector->addCard('operations', 'Operations', 'Visa income', 'PHP '.number_format((float) (clone $query)->sum('income'), 2), 'ChartSpline', 'primary', href: '/visa');
        $collector->addAttention('operations', 'Operations', 'Visa in process', (clone $query)->whereIn('status', ['pending', 'on_process'])->count(), 'warning', '/visa');
    }
}
