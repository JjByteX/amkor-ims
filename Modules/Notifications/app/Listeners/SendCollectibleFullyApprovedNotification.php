<?php

namespace Modules\Notifications\Listeners;

use Modules\AccountsReceivable\Events\CollectibleFullyApproved;
use Modules\Notifications\Services\NotificationDispatcher;

class SendCollectibleFullyApprovedNotification
{
    public function handle(CollectibleFullyApproved $event): void
    {
        $collectible = $event->collectible;
        $ref         = $collectible->ar_number ?? "AR-{$collectible->id}";
        $client      = $collectible->customer_name ?? 'client';
        $url         = "/ar/{$collectible->id}";

        app(NotificationDispatcher::class)->notifyRoles(
            ['accounting_officer', 'general_manager', 'admin_auditor'],
            'AR fully approved',
            "Collectible {$ref} for {$client} has been approved by both COO and GSM.",
            $url,
            'success',
        );
    }
}
