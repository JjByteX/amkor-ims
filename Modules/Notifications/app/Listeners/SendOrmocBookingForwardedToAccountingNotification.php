<?php

namespace Modules\Notifications\Listeners;

use Modules\Notifications\Services\NotificationDispatcher;
use Modules\OrmocBranch\Events\OrmocBookingForwardedToAccounting;

class SendOrmocBookingForwardedToAccountingNotification
{
    public function handle(OrmocBookingForwardedToAccounting $event): void
    {
        app(NotificationDispatcher::class)->notifyRoles(
            ['accounting_officer', 'general_manager', 'admin_auditor'],
            'Ormoc booking forwarded to accounting',
            "Booking for {$event->clientName} (Ormoc) is ready for accounting review.",
            "/ormoc/{$event->bookingId}",
            'info',
            true,
        );
    }
}
