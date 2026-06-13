<?php

namespace Modules\Disbursement\Providers;

use App\Events\DashboardSummaryRequested;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AccountsReceivable\Events\CollectibleEndorsedToDisbursement;
use Modules\Disbursement\Listeners\ContributeDashboardSummary;
use Modules\Disbursement\Listeners\CreateVoucherFromCollectible;

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

        // Phase 2 — Approved Collectible → Disbursement Auto-Creation
        CollectibleEndorsedToDisbursement::class => [
            CreateVoucherFromCollectible::class,
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
