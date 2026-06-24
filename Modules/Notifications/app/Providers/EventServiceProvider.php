<?php

namespace Modules\Notifications\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsReceivable\Events\CollectibleEndorsedToDisbursement;
use Modules\AccountsReceivable\Events\CollectibleFullyApproved;
use Modules\AccountsReceivable\Events\CollectibleSubmittedForApproval;
use Modules\Notifications\Listeners\ContributeDashboardSummary;
use Modules\Notifications\Listeners\SendBookingForwardedToAccountingNotification;
use Modules\Notifications\Listeners\SendCollectibleApprovalRequestedNotification;
use Modules\Notifications\Listeners\SendCollectibleEndorsedToDisbursementNotification;
use Modules\Notifications\Listeners\SendCollectibleFullyApprovedNotification;
use Modules\Notifications\Listeners\SendReservationBookingConfirmedNotification;
use Modules\Notifications\Listeners\SendVisaOrReceivedNotification;
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

        // Booking confirmed (all branches — QC and Ormoc)
        ReservationBookingConfirmed::class => [
            SendReservationBookingConfirmedNotification::class,
        ],

        // Booking forwarded to accounting (all branches — QC and Ormoc)
        // Replaces the old SendReservationForwardedToAccountingNotification +
        // SendOrmocBookingForwardedToAccountingNotification pair.
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
