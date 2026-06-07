<?php

namespace Modules\Reservation\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Reservation\Models\ReservationBooking;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'resa_officer', 'ormoc_branch_officer', 'accounting_officer', 'admin_auditor', 'chief_operations_officer', 'general_sales_manager'])) {
            return;
        }

        $query = ReservationBooking::query();

        $collector->addCard('operations', 'Operations', 'Bookings', $query->count(), 'PlaneTakeoff', 'primary', href: '/reservation');
        $collector->addCard('operations', 'Operations', 'Confirmed', (clone $query)->where('status', 'confirmed')->count(), 'CircleCheckBig', 'success', href: '/reservation');
        $collector->addCard('operations', 'Operations', 'RESA income', 'PHP '.number_format((float) (clone $query)->sum('income'), 2), 'ChartSpline', 'primary', href: '/reservation-sales');
        $collector->addAttention('operations', 'Operations', 'Bookings awaiting confirmation', (clone $query)->whereIn('status', ['inquiry', 'quoted'])->count(), 'warning', '/reservation');
    }
}
