<?php

namespace Modules\Notifications\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ExternalNoticeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $subject,
        private readonly string $greeting,
        private readonly array $lines,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->subject)
            ->greeting($this->greeting);

        foreach ($this->lines as $line) {
            $mail->line($line);
        }

        return $mail;
    }
}
