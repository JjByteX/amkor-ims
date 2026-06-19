<?php

namespace Modules\EmployeeRecords\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\EmployeeRecords\Models\Employee;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant'])) {
            return;
        }

        $query = Employee::query();

        $collector->addCard('people', 'People / Admin', 'Employees', $query->count(), 'UsersRound', 'primary', href: '/hr');
        $collector->addCard('people', 'People / Admin', 'Active employees', (clone $query)->whereIn('employment_status', ['probationary', 'regular'])->count(), 'UserRoundCheck', 'success', href: '/hr');
    }
}
