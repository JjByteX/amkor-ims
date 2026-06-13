<?php

namespace Modules\AccountsPayable\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsPayable\Listeners\ContributeDashboardSummary;
use Modules\AccountsPayable\Listeners\CreatePayableFromVisaPaymentRequest;
use Modules\Visa\Events\VisaPaymentRequested;

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

        // Phase 3 — auto-create a Payable when a visa payment request is sent
        VisaPaymentRequested::class => [
            CreatePayableFromVisaPaymentRequest::class,
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
