<?php

namespace Modules\Marketing\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Marketing\Models\MarketingExpense;
use Modules\Marketing\Models\MarketingMaterial;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'chief_operations_officer', 'marketing_officer'])) {
            return;
        }

        $materials = MarketingMaterial::query();

        $collector->addCard('marketing', 'Marketing', 'Materials', $materials->count(), 'Megaphone', 'primary', href: '/marketing');
        $collector->addCard('marketing', 'Marketing', 'Published', (clone $materials)->where('status', 'published')->count(), 'Send', 'success', href: '/marketing');
        $collector->addCard('marketing', 'Marketing', 'Expenses', 'PHP '.number_format((float) MarketingExpense::query()->sum('amount'), 2), 'BanknoteArrowDown', 'warning', href: '/marketing/expenses');
        $collector->addAttention('marketing', 'Marketing', 'For approval', (clone $materials)->where('status', 'submitted')->count(), 'warning', '/marketing');
    }
}
