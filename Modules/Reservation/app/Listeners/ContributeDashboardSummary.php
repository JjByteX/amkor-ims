<?php

namespace Modules\Reservation\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Reservation\Models\ReservationBooking;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'general_sales_manager', 'accounting_assistant', 'sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer'])) {
            return;
        }

        $query = ReservationBooking::query();

        $collector->addCard('operations', 'Operations', 'Bookings', $query->count(), 'PlaneTakeoff', 'primary', href: '/reservation');
        $collector->addCard('operations', 'Operations', 'Confirmed', (clone $query)->where('status', 'confirmed')->count(), 'CircleCheckBig', 'success', href: '/reservation');
        $collector->addCard('operations', 'Operations', 'RESA income', 'PHP '.number_format((float) (clone $query)->sum('income'), 2), 'ChartSpline', 'primary', href: '/reservation/sales-report');
        $collector->addAttention('operations', 'Operations', 'Bookings awaiting confirmation', (clone $query)->whereIn('status', ['inquiry', 'quoted'])->count(), 'warning', '/reservation');
    }
}
