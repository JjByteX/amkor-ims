<?php

namespace Modules\BirCompliance\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\BirCompliance\Console\Commands\SendBirDeadlineReminders;
use Nwidart\Modules\Support\ModuleServiceProvider;

class BirComplianceServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'BirCompliance';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'bircompliance';

    /**
     * Artisan commands provided by this module.
     *
     * @var string[]
     */
    protected array $commands = [
        SendBirDeadlineReminders::class,
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
     * Scheduled tasks for the BirCompliance module.
     *
     * Phase 15: daily deadline check — notifies accounting_officer and
     * general_manager 7, 3, and 1 day(s) before each BIR filing deadline.
     * A per-deadline-per-window cooldown prevents duplicate alerts on the same day.
     */
    protected function configureSchedules(Schedule $schedule): void
    {
        // Runs at 07:30 daily — after cc-monthly (07:00) but before the
        // cashbond balance check (08:00), grouped with the morning alert batch.
        $schedule->command('finance:bir-deadline-reminders')->dailyAt('07:30');
    }
}
