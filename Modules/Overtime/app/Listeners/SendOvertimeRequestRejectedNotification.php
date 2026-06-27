<?php

namespace Modules\Overtime\Listeners;

use Illuminate\Support\Facades\Notification;
use Modules\Notifications\Notifications\WorkflowNotification;
use Modules\Overtime\Events\OvertimeRequestRejected;

class SendOvertimeRequestRejectedNotification
{
    public function handle(OvertimeRequestRejected $event): void
    {
        $ot       = $event->overtimeRequest;
        $employee = $ot->employee;
        $user     = $employee?->user;

        if (! $user) {
            return;
        }

        $date   = $ot->work_date?->format('M d, Y') ?? '—';
        $reason = $ot->rejection_reason ? " Reason: {$ot->rejection_reason}" : '';
        $url    = "/overtime?highlight={$ot->id}";

        Notification::send($user, new WorkflowNotification(
            'OT Request Rejected',
            "Your overtime request on {$date} was not approved.{$reason}",
            $url,
            'error',
        ));
    }
}
