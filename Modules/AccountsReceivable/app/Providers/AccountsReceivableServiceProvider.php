<?php

namespace Modules\AccountsReceivable\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\AccountsReceivable\Console\Commands\SweepOverdue;
use Nwidart\Modules\Support\ModuleServiceProvider;

class AccountsReceivableServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'AccountsReceivable';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'accountsreceivable';

    /**
     * Artisan commands provided by this module.
     *
     * @var string[]
     */
    protected array $commands = [
        SweepOverdue::class,
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
     * Scheduled tasks for the AccountsReceivable module.
     *
     * Phase 4b: nightly sweep keeps the stored status column consistent with
     * due_date reality so raw SQL reports and exports are always accurate.
     */
    protected function configureSchedules(Schedule $schedule): void
    {
        // Runs at 1:00 AM daily — sweeps all four finance tables and marks
        // any past-due unpaid records as overdue, then notifies the
        // disbursement officer with a batched summary if anything changed.
        $schedule->command('finance:sweep-overdue')->dailyAt('01:00');
    }
}
