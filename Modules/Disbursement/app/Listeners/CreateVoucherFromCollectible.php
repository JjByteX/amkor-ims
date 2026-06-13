<?php

namespace Modules\Disbursement\Listeners;

use Modules\AccountsReceivable\Events\CollectibleEndorsedToDisbursement;
use Modules\Disbursement\Models\Voucher;

class CreateVoucherFromCollectible
{
    /**
     * Handle the CollectibleEndorsedToDisbursement event.
     *
     * Creates a pre-filled Cash Voucher in the Disbursement module so the
     * disbursement officer finds a ready record instead of a blank form.
     *
     * Fields mapped from the Collectible:
     *   payee           ← customer_name
     *   amount          ← collectible_amount_php
     *   amount_usd      ← collectible_amount_usd
     *   details         ← particulars  (with AR / OR / SI reference numbers appended)
     *   date            ← endorsed_to_disbursement_at (today)
     *   account_code    ← department
     *   branch_id       ← branch_id
     */
    public function handle(CollectibleEndorsedToDisbursement $event): void
    {
        $collectible = $event->collectible;

        // Build a human-readable details string from available reference numbers
        $refs = array_filter([
            $collectible->ar_number  ? "AR# {$collectible->ar_number}"   : null,
            $collectible->or_number  ? "OR# {$collectible->or_number}"   : null,
            $collectible->si_number  ? "SI# {$collectible->si_number}"   : null,
        ]);

        $details = trim(
            implode(' | ', array_filter([$collectible->particulars, implode(', ', $refs)]))
        );

        Voucher::create([
            'type'             => 'cash',
            'voucher_no'       => Voucher::nextNumber('cash'),
            'date'             => now()->toDateString(),
            'payee'            => $collectible->customer_name,
            'details'          => $details ?: 'Endorsed from AR',
            'account_code'     => $collectible->department,
            'account_description' => 'AR Endorsement — ' . ($collectible->department ?? ''),
            'currency'         => 'PHP',
            'amount'           => $collectible->collectible_amount_php ?? 0,
            'amount_usd'       => $collectible->collectible_amount_usd ?? 0,
            'approval_status'  => 'pending',
            'branch_id'        => $collectible->branch_id,
            // created_by / updated_by are intentionally null — system-generated record
        ]);
    }
}
