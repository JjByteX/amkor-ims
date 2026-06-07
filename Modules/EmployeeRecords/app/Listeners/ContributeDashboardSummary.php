<?php

namespace Modules\EmployeeRecords\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\EmployeeRecords\Models\Employee;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'hr_admin_officer'])) {
            return;
        }

        $query = Employee::query();

        $collector->addCard('people', 'People / Admin', 'Employees', $query->count(), 'UsersRound', 'primary', href: '/hr');
        $collector->addCard('people', 'People / Admin', 'Active employees', (clone $query)->whereIn('employment_status', ['probationary', 'regular'])->count(), 'UserRoundCheck', 'success', href: '/hr');
    }
}
