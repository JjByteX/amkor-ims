<?php

namespace Modules\Notifications\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\Notifications\Listeners\SendReservationBookingConfirmedNotification;
use Modules\Notifications\Listeners\SendReservationForwardedToAccountingNotification;
use Modules\Reservation\Events\ReservationBookingConfirmed;
use Modules\Reservation\Events\ReservationForwardedToAccounting;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event handler mappings for the application.
     *
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        ReservationBookingConfirmed::class => [
            SendReservationBookingConfirmedNotification::class,
        ],
        ReservationForwardedToAccounting::class => [
            SendReservationForwardedToAccountingNotification::class,
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
