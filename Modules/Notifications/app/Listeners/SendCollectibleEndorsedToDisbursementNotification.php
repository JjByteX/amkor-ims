<?php

namespace Modules\Notifications\Listeners;

use Modules\AccountsReceivable\Events\CollectibleEndorsedToDisbursement;
use Modules\Notifications\Services\NotificationDispatcher;

class SendCollectibleEndorsedToDisbursementNotification
{
    public function handle(CollectibleEndorsedToDisbursement $event): void
    {
        $collectible = $event->collectible;

        app(NotificationDispatcher::class)->notifyRoles(
            ['disbursement_officer', 'admin_auditor', 'general_manager'],
            'Collectible endorsed to disbursement',
            "A cash voucher was auto-created from {$collectible->customer_name}'s fully-approved collectible and is awaiting checking.",
            '/disbursement/vouchers',
            'info',
            true,
        );
    }
}
