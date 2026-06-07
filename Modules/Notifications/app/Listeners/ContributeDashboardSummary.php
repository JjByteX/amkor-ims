<?php

namespace Modules\Notifications\Listeners;

use App\Events\DashboardSummaryRequested;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $user = $event->collector->user;

        $event->collector->addCard('today', 'Today / Attention', 'Unread notices', $user->unreadNotifications()->count(), 'BellDot', 'warning', href: '/notifications');
    }
}
