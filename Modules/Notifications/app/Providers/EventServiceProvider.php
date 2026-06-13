<?php

namespace Modules\Notifications\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsReceivable\Events\CollectibleEndorsedToDisbursement;
use Modules\AccountsReceivable\Events\CollectibleFullyApproved;
use Modules\AccountsReceivable\Events\CollectibleSubmittedForApproval;
use Modules\Notifications\Listeners\ContributeDashboardSummary;
use Modules\Notifications\Listeners\SendCollectibleApprovalRequestedNotification;
use Modules\Notifications\Listeners\SendCollectibleEndorsedToDisbursementNotification;
use Modules\Notifications\Listeners\SendCollectibleFullyApprovedNotification;
use Modules\Notifications\Listeners\SendOrmocBookingForwardedToAccountingNotification;
use Modules\Notifications\Listeners\SendReservationBookingConfirmedNotification;
use Modules\Notifications\Listeners\SendReservationForwardedToAccountingNotification;
use Modules\Notifications\Listeners\SendVisaOrReceivedNotification;
use Modules\OrmocBranch\Events\OrmocBookingForwardedToAccounting;
use Modules\Reservation\Events\ReservationBookingConfirmed;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Visa\Events\VisaOrReceived;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event handler mappings for the application.
     *
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        DashboardSummaryRequested::class => [
            ContributeDashboardSummary::class,
        ],
        ReservationBookingConfirmed::class => [
            SendReservationBookingConfirmedNotification::class,
        ],
        ReservationForwardedToAccounting::class => [
            SendReservationForwardedToAccountingNotification::class,
        ],
        CollectibleSubmittedForApproval::class => [
            SendCollectibleApprovalRequestedNotification::class,
        ],
        CollectibleFullyApproved::class => [
            SendCollectibleFullyApprovedNotification::class,
        ],
        OrmocBookingForwardedToAccounting::class => [
            SendOrmocBookingForwardedToAccountingNotification::class,
        ],
        CollectibleEndorsedToDisbursement::class => [
            SendCollectibleEndorsedToDisbursementNotification::class,
        ],
        VisaOrReceived::class => [
            SendVisaOrReceivedNotification::class,
        ],
    ];

    /**
     * Indicates if events should be discovered.
     *
     * @var bool
     */
    protected static $shouldDiscoverEvents = true;

    /**
     * Configure the proper event listeners for email verification.
     */
    protected function configureEmailVerification(): void {}
}
