<?php

namespace Modules\Visa\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Illuminate\Console\Scheduling\Schedule;

class VisaServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Visa';
    protected string $nameLower = 'visa';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    /**
     * Artisan commands provided by this module.
     */
    protected array $commands = [
        \Modules\Visa\Console\Commands\SendVisaPaymentReminders::class,
    ];

    /**
     * Scheduled tasks for the Visa module.
     *
     * Phase 4: stub registered — no real SMTP yet (MAIL_MAILER=log in dev).
     * Phase 12: uncomment and test all triggers end-to-end with real Gmail credentials.
     *
     * Trigger: 1 day before payment_due_date → email to Disbursement Officer.
     * Command: visa:send-payment-reminders (defined in Console/Commands/SendVisaPaymentReminders.php)
     */
    protected function configureSchedules(Schedule $schedule): void
    {
        // Runs daily at 8:00 AM — checks for applications with payment_due_date = tomorrow
        // and payment_request_sent = false, then queues VisaPaymentRequestMail to Disbursement Officers.
        // Phase 12 activates this once Gmail SMTP is configured and tested.
        $schedule->command('visa:send-payment-reminders')->dailyAt('08:00');
    }
}
