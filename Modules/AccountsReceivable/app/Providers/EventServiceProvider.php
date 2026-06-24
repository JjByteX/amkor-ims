<?php

namespace Modules\AccountsReceivable\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsReceivable\Listeners\ContributeDashboardSummary;
use Modules\AccountsReceivable\Listeners\CreateCollectibleFromBooking;
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
        // Handles ALL branches (QC and Ormoc) from the unified reservation_bookings table.
        // Replaces the old CreateCollectibleFromReservation + CreateCollectibleFromOrmocBooking pair.
        ReservationForwardedToAccounting::class => [
            CreateCollectibleFromBooking::class,
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
