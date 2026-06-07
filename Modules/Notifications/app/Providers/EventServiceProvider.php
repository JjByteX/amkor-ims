<?php

namespace Modules\Notifications\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event handler mappings for the application.
     *
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        \Modules\Reservation\Events\ReservationBookingConfirmed::class => [
            \Modules\Notifications\Listeners\SendReservationBookingConfirmedNotification::class,
        ],
        \Modules\Reservation\Events\ReservationForwardedToAccounting::class => [
            \Modules\Notifications\Listeners\SendReservationForwardedToAccountingNotification::class,
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
