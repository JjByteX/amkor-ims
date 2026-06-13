<?php

namespace Modules\AccountsPayable\Listeners;

use Modules\AccountsPayable\Models\Payable;
use Modules\Visa\Events\VisaPaymentRequested;

/**
 * Phase 3 — Auto-create an AP Payable when a visa payment request is sent.
 *
 * Trigger : VisaPaymentRequested (fired by VisaController::sendPaymentRequest)
 * Result  : A pending Payable record pre-filled with the visa application's
 *           operator name, amount, due date, and a back-reference to the
 *           visa application via `acr` (used as a cross-module reference key).
 *
 * Idempotency: the listener checks for an existing payable with the same
 * acr value before creating, so replaying the event is safe.
 */
class CreatePayableFromVisaPaymentRequest
{
    public function handle(VisaPaymentRequested $event): void
    {
        $visa = $event->application;

        // Build a stable cross-module reference: "VISA-{id}"
        $acr = 'VISA-' . $visa->id;

        // Guard: don't create duplicates if the event is replayed
        if (Payable::where('acr', $acr)->exists()) {
            return;
        }

        // Derive the supplier name from the agency if present,
        // falling back to the customer name.
        $supplierName = filled($visa->agency)
            ? $visa->agency
            : $visa->customer_name;

        Payable::create([
            'supplier_name'        => $supplierName,
            'invoice_date'         => $visa->date,
            'invoice_no'           => $visa->si_number,
            'currency'             => 'PHP',
            'invoice_amount_php'   => $visa->net_payable ?? 0,
            'balance_php'          => $visa->net_payable ?? 0,
            'due_date'             => $visa->payment_due_date,
            'status'               => 'pending',
            'approval_status'      => 'pending',
            'acr'                  => $acr,         // human-readable back-reference
            'visa_application_id'  => $visa->id,    // relational FK (Phase 3 migration)
            'remarks'              => vsprintf(
                'Auto-created from Visa Application #%d — %s (%s)',
                [$visa->id, $visa->customer_name, $visa->visa_type]
            ),
            'branch_id'            => $visa->branch_id,
        ]);
    }
}
