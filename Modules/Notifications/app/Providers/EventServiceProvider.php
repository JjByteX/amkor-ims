<?php

namespace Modules\Notifications\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsReceivable\Events\CollectibleEndorsedToDisbursement;
use Modules\AccountsReceivable\Events\CollectibleFullyApproved;
use Modules\AccountsReceivable\Events\CollectibleSubmittedForApproval;
use Modules\Leave\Events\LeaveRequestApproved;
use Modules\Leave\Events\LeaveRequestFiled;
use Modules\Leave\Events\LeaveRequestRejected;
use Modules\Leave\Listeners\SendLeaveRequestApprovedNotification;
use Modules\Leave\Listeners\SendLeaveRequestFiledNotification;
use Modules\Leave\Listeners\SendLeaveRequestRejectedNotification;
use Modules\Notifications\Listeners\ContributeDashboardSummary;
use Modules\Notifications\Listeners\SendBookingForwardedToAccountingNotification;
use Modules\Notifications\Listeners\SendCollectibleApprovalRequestedNotification;
use Modules\Notifications\Listeners\SendCollectibleEndorsedToDisbursementNotification;
use Modules\Notifications\Listeners\SendCollectibleFullyApprovedNotification;
use Modules\Notifications\Listeners\SendReservationBookingConfirmedNotification;
use Modules\Notifications\Listeners\SendVisaOrReceivedNotification;
use Modules\Overtime\Events\OvertimeRequestApproved;
use Modules\Overtime\Events\OvertimeRequestFiled;
use Modules\Overtime\Events\OvertimeRequestRejected;
use Modules\Overtime\Listeners\SendOvertimeRequestApprovedNotification;
use Modules\Overtime\Listeners\SendOvertimeRequestFiledNotification;
use Modules\Overtime\Listeners\SendOvertimeRequestRejectedNotification;
use Modules\Reservation\Events\ReservationBookingConfirmed;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Visa\Events\VisaOrReceived;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        DashboardSummaryRequested::class => [
            ContributeDashboardSummary::class,
        ],

        ReservationBookingConfirmed::class => [
            SendReservationBookingConfirmedNotification::class,
        ],

        ReservationForwardedToAccounting::class => [
            SendBookingForwardedToAccountingNotification::class,
        ],

        CollectibleSubmittedForApproval::class => [
            SendCollectibleApprovalRequestedNotification::class,
        ],
        CollectibleFullyApproved::class => [
            SendCollectibleFullyApprovedNotification::class,
        ],
        CollectibleEndorsedToDisbursement::class => [
            SendCollectibleEndorsedToDisbursementNotification::class,
        ],
        VisaOrReceived::class => [
            SendVisaOrReceivedNotification::class,
        ],

        // ── Leave Requests ────────────────────────────────────────────────
        LeaveRequestFiled::class => [
            SendLeaveRequestFiledNotification::class,
        ],
        LeaveRequestApproved::class => [
            SendLeaveRequestApprovedNotification::class,
        ],
        LeaveRequestRejected::class => [
            SendLeaveRequestRejectedNotification::class,
        ],

        // ── Overtime Requests ─────────────────────────────────────────────
        OvertimeRequestFiled::class => [
            SendOvertimeRequestFiledNotification::class,
        ],
        OvertimeRequestApproved::class => [
            SendOvertimeRequestApprovedNotification::class,
        ],
        OvertimeRequestRejected::class => [
            SendOvertimeRequestRejectedNotification::class,
        ],
    ];

    protected static $shouldDiscoverEvents = false;

    protected function configureEmailVerification(): void {}
}
