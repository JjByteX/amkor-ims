<?php

namespace Modules\Disbursement\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Disbursement\Console\Commands\SendAccessFilesReminder;
use Nwidart\Modules\Support\ModuleServiceProvider;

class DisbursementServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Disbursement';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'disbursement';

    /**
     * Artisan commands provided by this module.
     *
     * @var string[]
     */
    protected array $commands = [
        SendAccessFilesReminder::class,
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
     * Scheduled tasks for the Disbursement module.
     *
     * Confirmed client ground truth (Dalle's workflow):
     *   "Sends access files to Admin Auditor every 15th and end of month."
     *
     * The command itself checks whether today is the 15th or the last day of
     * the month and exits immediately otherwise, so running it daily is safe
     * and inexpensive. Scheduled at 07:45 — slotted between:
     *   07:30  finance:bir-deadline-reminders   (BirCompliance)
     *   07:45  disbursement:send-access-files-reminder  ← this
     *   08:00  finance:check-cashbond-balances   (Cashbond)
     */
    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('disbursement:send-access-files-reminder')->dailyAt('07:45');
    }
}
