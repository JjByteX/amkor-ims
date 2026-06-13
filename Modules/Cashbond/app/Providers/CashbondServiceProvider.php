<?php

namespace Modules\Cashbond\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Cashbond\Console\Commands\CheckCashbondBalances;
use Nwidart\Modules\Support\ModuleServiceProvider;

class CashbondServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Cashbond';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'cashbond';

    /**
     * Artisan commands provided by this module.
     *
     * @var string[]
     */
    protected array $commands = [
        CheckCashbondBalances::class,
    ];

    /**
     * Provider classes to register.
     *
     * @var string[]
     */
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    /**
     * Scheduled tasks for the Cashbond module.
     *
     * Phase 12: daily low-balance check — notifies the disbursement officer
     * whenever any active portal's balance is below its maintaining threshold.
     * A per-portal cooldown prevents duplicate alerts on the same day.
     */
    protected function configureSchedules(Schedule $schedule): void
    {
        // Runs at 8:00 AM daily — checks all active portals and alerts the
        // disbursement officer for any that are below their maintaining balance.
        $schedule->command('finance:check-cashbond-balances')->dailyAt('08:00');
    }
}
