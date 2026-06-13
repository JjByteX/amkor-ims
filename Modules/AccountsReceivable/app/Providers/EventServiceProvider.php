<?php

namespace Modules\AccountsReceivable\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsReceivable\Listeners\ContributeDashboardSummary;
use Modules\AccountsReceivable\Listeners\CreateCollectibleFromOrmocBooking;
use Modules\AccountsReceivable\Listeners\CreateCollectibleFromReservation;
use Modules\OrmocBranch\Events\OrmocBookingForwardedToAccounting;
use Modules\Reservation\Events\ReservationForwardedToAccounting;

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

        // Phase 1 — Booking → AR Auto-Creation
        ReservationForwardedToAccounting::class => [
            CreateCollectibleFromReservation::class,
        ],
        OrmocBookingForwardedToAccounting::class => [
            CreateCollectibleFromOrmocBooking::class,
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
