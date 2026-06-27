<?php

namespace Modules\Leave\Listeners;

use Illuminate\Support\Facades\Notification;
use Modules\Leave\Events\LeaveRequestApproved;
use Modules\Notifications\Notifications\WorkflowNotification;

class SendLeaveRequestApprovedNotification
{
    public function handle(LeaveRequestApproved $event): void
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
        $approver = $leave->approver?->name ?? 'HR';
        $url      = "/leave?highlight={$leave->id}";

        Notification::send($user, new WorkflowNotification(
            "Leave Approved — {$type}",
            "Your {$type} ({$dateFrom}–{$dateTo}) was approved by {$approver}.",
            $url,
            'success',
        ));
    }
}
