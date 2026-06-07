<?php

namespace Modules\Notifications\Listeners;

use Modules\Notifications\Services\NotificationDispatcher;
use Modules\Reservation\Events\ReservationBookingConfirmed;

class SendReservationBookingConfirmedNotification
{
    public function handle(ReservationBookingConfirmed $event): void
    {
        app(NotificationDispatcher::class)->notifyRoles(
            ['chief_operations_officer', 'general_sales_manager', 'general_manager', 'accounting_officer'],
            'Reservation confirmed',
            "{$event->bookingNo} for {$event->clientName} has been confirmed.",
            "/reservation/{$event->bookingId}",
            'success',
        );
    }
}
