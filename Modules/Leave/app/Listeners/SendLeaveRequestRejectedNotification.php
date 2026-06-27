<?php

namespace Modules\Leave\Listeners;

use Illuminate\Support\Facades\Notification;
use Modules\Leave\Events\LeaveRequestRejected;
use Modules\Notifications\Notifications\WorkflowNotification;

class SendLeaveRequestRejectedNotification
{
    public function handle(LeaveRequestRejected $event): void
    {
        $leave    = $event->leaveRequest;
        $employee = $leave->employee;
        $user     = $employee?->user;

        if (! $user) {
            return;
        }

        $type     = \Modules\Leave\Models\LeaveRequest::LEAVE_TYPES[$leave->leave_type] ?? $leave->leave_type;
        $dateFrom = $leave->date_from?->format('M d, Y') ?? '—';
        $dateTo   = $leave->date_to?->format('M d, Y') ?? '—';
        $reason   = $leave->rejection_reason ? " Reason: {$leave->rejection_reason}" : '';
        $url      = "/leave?highlight={$leave->id}";

        Notification::send($user, new WorkflowNotification(
            "Leave Rejected — {$type}",
            "Your {$type} ({$dateFrom}–{$dateTo}) was not approved.{$reason}",
            $url,
            'error',
        ));
    }
}
