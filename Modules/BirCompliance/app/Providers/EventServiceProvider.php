<?php

namespace Modules\BirCompliance\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\BirCompliance\Listeners\ContributeDashboardSummary;
use Modules\BirCompliance\Listeners\CreateBirTransactionFromOrmocBooking;
use Modules\BirCompliance\Listeners\CreateBirTransactionFromReservation;
use Modules\BirCompliance\Listeners\CreateBirTransactionFromVisaOr;
use Modules\OrmocBranch\Events\OrmocBookingForwardedToAccounting;
use Modules\Reservation\Events\ReservationBookingConfirmed;
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

        // Phase 7 — BIR Auto-Population
        // Fires when a Reservation booking is confirmed → creates BIR AR record
        ReservationBookingConfirmed::class => [
            CreateBirTransactionFromReservation::class,
        ],

        // Phase 7 — BIR Auto-Population
        // Fires when an Ormoc booking is forwarded to accounting → creates BIR AR record
        OrmocBookingForwardedToAccounting::class => [
            CreateBirTransactionFromOrmocBooking::class,
        ],

        // Phase 7 — BIR Auto-Population
        // Fires when an OR number is recorded on a visa application → creates BIR SI record
        VisaOrReceived::class => [
            CreateBirTransactionFromVisaOr::class,
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
