<?php

namespace Modules\BirCompliance\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\BirCompliance\Listeners\ContributeDashboardSummary;
use Modules\BirCompliance\Listeners\CreateBirTransactionFromBooking;
use Modules\BirCompliance\Listeners\CreateBirTransactionFromVisaOr;
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
        // Fires when ANY booking (QC or Ormoc) is confirmed → creates BIR AR record.
        // Both branches now follow QC's confirmation-trigger behaviour, as confirmed
        // with the client. Replaces the old paired listeners.
        ReservationBookingConfirmed::class => [
            CreateBirTransactionFromBooking::class,
        ],

        // Phase 7 — BIR Auto-Population
        // Fires when an OR number is recorded on a visa application → creates BIR SI record.
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
