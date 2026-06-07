<?php

namespace Modules\OrmocBranch\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Modules\OrmocBranch\Models\OrmocBooking;

/**
 * OrmocEscalationMail
 *
 * Sent to Ms. Jhona Ramos (RESA Officer, QC Head Office) when an Ormoc Branch
 * Officer escalates an international booking that Ormoc cannot issue on its own.
 *
 * Ormoc operates under QC main office's IATA registration and authority;
 * international issuances must go through QC RESA or Mariposa (external consolidator).
 *
 * Mail driver: Gmail SMTP (ADR-002).
 * Queue: dispatched via the queue worker — not sent synchronously.
 * Full wiring (real SMTP credentials) completed in Phase 12.
 *
 * Development: set MAIL_MAILER=log in .env — writes to storage/logs/laravel.log.
 */
class OrmocEscalationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly OrmocBooking $booking,
        public readonly string $escalatedByName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Amkor IMS] International Booking Escalation — '.$this->booking->client_name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'ormocbranch::emails.escalation',
        );
    }
}
