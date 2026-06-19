<?php

namespace Modules\CreditCardMonitoring\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\CreditCardMonitoring\Models\CreditCard;
use Modules\CreditCardMonitoring\Models\CreditCardPayment;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'accounting_assistant'])) {
            return;
        }

        $collector->addCard('finance', 'Finance', 'Credit cards', CreditCard::query()->count(), 'CreditCard', 'primary', href: '/credit-cards/cards');
        $collector->addAttention('finance', 'Finance', 'Card payments pending', CreditCardPayment::query()->where('status', 'pending')->count(), 'warning', '/credit-cards');
    }
}
