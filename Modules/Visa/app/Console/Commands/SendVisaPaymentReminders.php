<?php

namespace Modules\Visa\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Modules\Visa\Mail\VisaPaymentRequestMail;
use Modules\Visa\Models\VisaApplication;

/**
 * SendVisaPaymentReminders
 *
 * Scheduled daily at 08:00 by VisaServiceProvider::configureSchedules().
 *
 * Finds all visa applications where:
 *   - payment_due_date = tomorrow
 *   - payment_request_sent = false
 *   - not soft-deleted
 *
 * Queues a VisaPaymentRequestMail to all active Disbursement Officers.
 * Marks payment_request_sent = true to prevent duplicate emails.
 *
 * Phase 4: registered and scheduled. Mail falls through to log driver in dev.
 * Phase 12: Gmail SMTP configured, this is end-to-end tested.
 */
class SendVisaPaymentReminders extends Command
{
    protected $signature = 'visa:send-payment-reminders';
    protected $description = 'Queue payment reminder emails to Disbursement Officers for visa applications due tomorrow.';

    public function handle(): int
    {
        $tomorrow = now()->addDay()->toDateString();

        $applications = VisaApplication::where('payment_due_date', $tomorrow)
            ->where('payment_request_sent', false)
            ->whereNull('deleted_at')
            ->get();

        if ($applications->isEmpty()) {
            $this->info('No visa payment reminders to send today.');
            return self::SUCCESS;
        }

        $disbursementOfficers = User::role('disbursement_officer')
            ->where('is_active', true)
            ->whereNotNull('email')
            ->get();

        if ($disbursementOfficers->isEmpty()) {
            $this->warn('No active Disbursement Officers found. Check seeded users.');
            return self::FAILURE;
        }

        $sent = 0;

        foreach ($applications as $application) {
            foreach ($disbursementOfficers as $officer) {
                Mail::to($officer->email)
                    ->queue(new VisaPaymentRequestMail(
                        $application,
                        'Amkor IMS Scheduler'
                    ));
            }

            $application->update([
                'payment_request_sent'    => true,
                'payment_request_sent_at' => now(),
            ]);

            $sent++;
        }

        $this->info("Queued payment reminders for {$sent} application(s).");

        return self::SUCCESS;
    }
}
