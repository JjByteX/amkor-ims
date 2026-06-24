<?php

namespace Modules\Reservation\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Modules\Reservation\Models\ReservationBooking;

/**
 * OrmocEscalationMail
 *
 * Sent to Ms. Jhona Ramos (Sales & Ticketing Officer, QC Head Office) when an
 * Ormoc Branch Officer escalates an international booking that Ormoc cannot
 * issue on its own.
 *
 * Ormoc operates under QC main office's IATA registration and authority;
 * international issuances must go through QC RESA or Mariposa (external consolidator).
 *
 * Mail driver: Gmail SMTP (ADR-002).
 * Queue: dispatched via the queue worker — not sent synchronously.
 *
 * Development: set MAIL_MAILER=log in .env — writes to storage/logs/laravel.log.
 */
class OrmocEscalationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ReservationBooking $booking,
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
            view: 'reservation::emails.escalation',
        );
    }
}
