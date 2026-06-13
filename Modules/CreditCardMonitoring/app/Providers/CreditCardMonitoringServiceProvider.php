<?php

namespace Modules\CreditCardMonitoring\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\CreditCardMonitoring\Console\Commands\CreditCardMonthly;
use Nwidart\Modules\Support\ModuleServiceProvider;

class CreditCardMonitoringServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'CreditCardMonitoring';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'creditcardmonitoring';

    /**
     * Artisan commands provided by this module.
     *
     * @var string[]
     */
    protected array $commands = [
        CreditCardMonthly::class,
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
     * Scheduled tasks for the CreditCardMonitoring module.
     *
     * Phases 11 + 13: daily run handles three jobs in one pass —
     *   1. On the 1st: auto-create payment records for every active card.
     *   2. 3 days before statement_cut_off: send cut-off reminder.
     *   3. 5 days before due_day: send payment due reminder.
     */
    protected function configureSchedules(Schedule $schedule): void
    {
        // Runs at 07:00 daily — early enough that officers see reminders at
        // the start of their workday, before the cashbond check at 08:00.
        $schedule->command('finance:cc-monthly')->dailyAt('07:00');
    }
}
