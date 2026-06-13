<?php

namespace Modules\Visa\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\Visa\Events\VisaOrReceived;
use Modules\Visa\Events\VisaPaymentRequested;
use Modules\Visa\Listeners\ContributeDashboardSummary;
use Modules\Visa\Listeners\MarkPaymentRequestSent;

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

        // Phase 3 — fires after sendPaymentRequest; AP listener picks this up
        // to auto-create the Payable record.
        VisaPaymentRequested::class => [
            MarkPaymentRequestSent::class,
        ],

        // Phase 7 — VisaOrReceived is consumed by BirCompliance module
        // to auto-create the BIR SI transaction. No local listener needed here.
        // Registered in Modules/BirCompliance/app/Providers/EventServiceProvider.php.
        VisaOrReceived::class => [],
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
