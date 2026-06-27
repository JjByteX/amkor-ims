<?php

namespace Modules\Overtime\Listeners;

use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Modules\Notifications\Notifications\WorkflowNotification;
use Modules\Overtime\Events\OvertimeRequestFiled;
use Modules\Overtime\Models\OvertimeRequest;

class SendOvertimeRequestFiledNotification
{
    public function handle(OvertimeRequestFiled $event): void
    {
        $ot       = $event->overtimeRequest;
        $employee = $ot->employee;

        if (! $employee) {
            return;
        }

        $name     = $employee->display_name ?? 'An employee';
        $date     = $ot->work_date?->format('M d, Y') ?? '—';
        $duration = $ot->duration_label;
        $url      = "/overtime?highlight={$ot->id}";

        $title   = "OT Request — {$name}";
        $message = "{$date} · {$duration} · Pending your approval";

        $hrRoles = [
            'president',
            'chief_operating_officer',
            'finance_admin_supervisor',
            'administrative_assistant',
        ];

        $recipients = User::role($hrRoles)->get();

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
