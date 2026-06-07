<?php

namespace Modules\Contacts\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Contacts\Models\Contact;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $event->collector->addCard('people', 'People / Admin', 'Contacts', Contact::query()->count(), 'ContactRound', 'default', href: '/contacts');
    }
}
