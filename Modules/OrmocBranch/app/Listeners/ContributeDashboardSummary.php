<?php

namespace Modules\OrmocBranch\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\OrmocBranch\Models\OrmocBooking;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'ormoc_branch_officer'])) {
            return;
        }

        $query = OrmocBooking::query();

        $collector->addCard('operations', 'Operations', 'Ormoc bookings', $query->count(), 'MapPinned', 'primary', href: '/ormoc');
        $collector->addCard('operations', 'Operations', 'Ormoc sales', 'PHP '.number_format((float) (clone $query)->sum('selling_price'), 2), 'BanknoteArrowUp', 'primary', href: '/ormoc');
        $collector->addAttention('operations', 'Operations', 'Ormoc pending', (clone $query)->whereIn('status', ['inquiry', 'quoted'])->count(), 'warning', '/ormoc');
    }
}
