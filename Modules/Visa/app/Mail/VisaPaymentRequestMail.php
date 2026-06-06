<?php

namespace Modules\Visa\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Modules\Visa\Models\VisaApplication;

/**
 * VisaPaymentRequestMail
 *
 * Sent to the Disbursement Officer (Dalle) when a Visa & Documentation Officer
 * triggers a payment request — typically one day before the embassy payment due date.
 *
 * Mail driver: Gmail SMTP (ADR-002).
 * Queue: dispatched via SendVisaPaymentRequestJob (queued, not sync).
 * Full wiring (scheduler + real SMTP credentials) completed in Phase 12.
 *
 * Development: set MAIL_MAILER=log in .env — writes to storage/logs/laravel.log.
 */
class VisaPaymentRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly VisaApplication $application,
        public readonly string $requestedByName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Amkor IMS] Visa Payment Request — ' . $this->application->customer_name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'visa::emails.payment-request',
            with: [
                'application'     => $this->application,
                'requestedByName' => $this->requestedByName,
                'dueDate'         => $this->application->payment_due_date?->format('F j, Y'),
                'visaType'        => $this->application->visa_type,
                'customerName'    => $this->application->customer_name,
                'amount'          => number_format($this->application->net_payable, 2),
            ],
        );
    }
}
