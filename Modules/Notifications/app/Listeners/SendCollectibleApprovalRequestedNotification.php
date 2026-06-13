<?php

namespace Modules\Notifications\Listeners;

use Modules\AccountsReceivable\Events\CollectibleSubmittedForApproval;
use Modules\Notifications\Services\NotificationDispatcher;

class SendCollectibleApprovalRequestedNotification
{
    public function handle(CollectibleSubmittedForApproval $event): void
    {
        $collectible = $event->collectible;
        $ref         = $collectible->ar_number ?? "AR-{$collectible->id}";
        $client      = $collectible->customer_name ?? 'client';
        $url         = "/ar/{$collectible->id}";

        app(NotificationDispatcher::class)->notifyRoles(
            ['chief_operations_officer', 'general_sales_manager', 'general_manager'],
            'AR approval required',
            "Collectible {$ref} for {$client} is pending your approval.",
            $url,
            'warning',
        );
    }
}
