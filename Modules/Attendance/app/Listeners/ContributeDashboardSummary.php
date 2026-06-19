<?php

namespace Modules\Attendance\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Attendance\Models\AttendanceRecord;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can('all')) {  // all authenticated staff have an attendance record
            return;
        }

        $today = now()->toDateString();
        $query = AttendanceRecord::query()->whereDate('work_date', $today);

        $collector->addCard('today', 'Today / Attention', 'Present today', (clone $query)->where('status', 'present')->count(), 'CalendarCheck2', 'success', href: '/hr/attendance');
        $collector->addAttention('today', 'Today / Attention', 'Late records today', (clone $query)->where('minutes_late', '>', 0)->count(), 'warning', '/hr/attendance');
    }
}
