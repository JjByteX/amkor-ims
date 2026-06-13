<?php

namespace Modules\Notifications\Listeners;

use Modules\Notifications\Services\NotificationDispatcher;
use Modules\Visa\Events\VisaOrReceived;

class SendVisaOrReceivedNotification
{
    public function handle(VisaOrReceived $event): void
    {
        app(NotificationDispatcher::class)->notifyRoles(
            ['accounting_officer', 'general_manager', 'admin_auditor'],
            'Visa OR received',
            "OR #{$event->orNumber} was recorded on a visa application. A Service Invoice transaction has been generated for review.",
            "/visa/{$event->visaId}",
            'info',
            true,
        );
    }
}
