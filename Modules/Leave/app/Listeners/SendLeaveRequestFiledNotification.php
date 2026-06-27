<?php

namespace Modules\Leave\Listeners;

use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Modules\Leave\Events\LeaveRequestFiled;
use Modules\Notifications\Notifications\WorkflowNotification;

class SendLeaveRequestFiledNotification
{
    public function handle(LeaveRequestFiled $event): void
    {
        $leave    = $event->leaveRequest;
        $employee = $leave->employee;

        if (! $employee) {
            return;
        }

        $name     = $employee->display_name ?? 'An employee';
        $type     = \Modules\Leave\Models\LeaveRequest::LEAVE_TYPES[$leave->leave_type] ?? $leave->leave_type;
        $dateFrom = $leave->date_from?->format('M d, Y') ?? '—';
        $dateTo   = $leave->date_to?->format('M d, Y') ?? '—';
        $days     = $leave->days_requested;
        $dayLabel = $days == 0.5 ? '½ day' : "{$days} day" . ($days != 1 ? 's' : '');
        $url      = "/leave?highlight={$leave->id}";

        $title   = "Leave Request — {$name}";
        $message = "{$type} · {$dateFrom}–{$dateTo} ({$dayLabel}) · Pending your approval";

        // HR admin roles
        $hrRoles = [
            'president',
            'chief_operating_officer',
            'finance_admin_supervisor',
            'administrative_assistant',
        ];

        $recipients = User::role($hrRoles)->get();

        // Branch supervisor of the employee's branch
        if ($employee->branch_id) {
            $supervisors = User::role('branch_supervisor')
                ->whereHas('employee', fn ($q) => $q->where('branch_id', $employee->branch_id))
                ->get();

            $recipients = $recipients->merge($supervisors)->unique('id');
        }

        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send($recipients, new WorkflowNotification($title, $message, $url, 'warning'));
    }
}
