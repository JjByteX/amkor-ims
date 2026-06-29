<?php

namespace Modules\Visa\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsPayable\Events\PayableReceived;
use Modules\AccountsPayable\Events\PayableReleased;
use Modules\Visa\Events\VisaOrReceived;
use Modules\Visa\Events\VisaPaymentRequested;
use Modules\Visa\Listeners\ContributeDashboardSummary;
use Modules\Visa\Listeners\MarkPaymentRequestSent;
use Modules\Visa\Listeners\SyncCvNumberOnPayableRelease;
use Modules\Visa\Listeners\SyncDateReceivedOnPayableReceived;

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

        // Phase 7 — write CV number / date requested / date received back
        // onto the originating visa application as its linked AP Payable
        // moves through release → received.
        PayableReleased::class => [
            SyncCvNumberOnPayableRelease::class,
        ],
        PayableReceived::class => [
            SyncDateReceivedOnPayableReceived::class,
        ],
    ];

    /**
     * Indicates if events should be discovered.
     *
     * @var bool
     */
    protected static $shouldDiscoverEvents = false;

    /**
     * Configure the proper event listeners for email verification.
     */
    protected function configureEmailVerification(): void {}
}
