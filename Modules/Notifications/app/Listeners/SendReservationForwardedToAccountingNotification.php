<?php

namespace Modules\Notifications\Listeners;

use Modules\Notifications\Services\NotificationDispatcher;
use Modules\Reservation\Events\ReservationForwardedToAccounting;

class SendReservationForwardedToAccountingNotification
{
    public function handle(ReservationForwardedToAccounting $event): void
    {
        app(NotificationDispatcher::class)->notifyRoles(
            ['accounting_officer', 'general_manager', 'admin_auditor'],
            'Reservation forwarded to accounting',
            "{$event->bookingNo} for {$event->clientName} is ready for accounting review.",
            "/reservation/{$event->bookingId}",
            'info',
            true,
        );
    }
}
