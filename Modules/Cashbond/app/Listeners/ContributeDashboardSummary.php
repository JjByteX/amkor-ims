<?php

namespace Modules\Cashbond\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Cashbond\Models\CashbondPortal;
use Modules\Cashbond\Models\CashbondReload;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'accounting_assistant', 'liaison_officer_finance'])) {
            return;
        }

        $collector->addCard('finance', 'Finance', 'Cashbond portals', CashbondPortal::query()->count(), 'ShieldCheck', 'primary', href: '/cashbond');
        $collector->addAttention('finance', 'Finance', 'Cashbond reloads pending', CashbondReload::query()->where('approval_status', 'pending')->count(), 'warning', '/cashbond/reloads');
    }
}
