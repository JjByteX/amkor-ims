<?php

namespace Modules\Overtime\Listeners;

use Illuminate\Support\Facades\Notification;
use Modules\Notifications\Notifications\WorkflowNotification;
use Modules\Overtime\Events\OvertimeRequestApproved;

class SendOvertimeRequestApprovedNotification
{
    public function handle(OvertimeRequestApproved $event): void
    {
        $ot       = $event->overtimeRequest;
        $employee = $ot->employee;
        $user     = $employee?->user;

        if (! $user) {
            return;
        }

        $date     = $ot->work_date?->format('M d, Y') ?? '—';
        $duration = $ot->duration_label;
        $approver = $ot->approver?->name ?? 'HR';
        $url      = "/overtime?highlight={$ot->id}";

        Notification::send($user, new WorkflowNotification(
            'OT Request Approved',
            "Your overtime on {$date} ({$duration}) was approved by {$approver}.",
            $url,
            'success',
        ));
    }
}
