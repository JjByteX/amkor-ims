<?php

namespace Modules\Disbursement\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Disbursement\Models\DisbursementEntry;
use Modules\Disbursement\Models\Voucher;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['general_manager', 'disbursement_officer', 'admin_auditor'])) {
            return;
        }

        $entries = DisbursementEntry::query();
        $vouchers = Voucher::query();

        $collector->addCard('finance', 'Finance', 'Disbursed', 'PHP '.number_format((float) (clone $entries)->sum('amount'), 2), 'WalletCards', 'primary', href: '/disbursement/ledger');
        $collector->addCard('finance', 'Finance', 'Vouchers', $vouchers->count(), 'ClipboardList', 'default', href: '/disbursement/vouchers');
        $collector->addAttention('finance', 'Finance', 'Vouchers pending', (clone $vouchers)->where('approval_status', 'pending')->count(), 'warning', '/disbursement/vouchers');
    }
}
