<?php

namespace Modules\AccountsPayable\Listeners;

use Modules\AccountsPayable\Models\Payable;
use Modules\Visa\Events\VisaPaymentRequested;

/**
 * Auto-create an AP Payable when a visa payment request is sent.
 *
 * Trigger : VisaPaymentRequested (fired by VisaController::sendPaymentRequest)
 * Result  : A pending Payable record pre-filled with the visa application's
 *           supplier name, amount, due date, and a back-reference to the
 *           visa application via `acr` and `visa_application_id`.
 *
 * Supplier name resolution (priority order):
 *   1. embassy_name  — the actual embassy/consulate being paid (most specific)
 *   2. agency        — the travel agency (intermediate)
 *   3. customer_name — last resort when neither is set
 *
 * Idempotency: checks for an existing payable with the same `acr` value
 * before creating, so replaying the event is safe.
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

        // Supplier name: embassy first (most accurate), then agency, then customer
        $supplierName = filled($visa->embassy_name)
            ? $visa->embassy_name
            : (filled($visa->agency) ? $visa->agency : $visa->customer_name);

        Payable::create([
            'supplier_name'       => $supplierName,
            'invoice_date'        => $visa->date,
            'invoice_no'          => $visa->si_number,
            'currency'            => 'PHP',
            'invoice_amount_php'  => $visa->net_payable ?? 0,
            // balance_php is NOT set here — recalculate() will derive it
            'due_date'            => $visa->payment_due_date,
            'status'              => 'pending',
            'approval_status'     => 'pending',
            'acr'                 => $acr,
            'visa_application_id' => $visa->id,
            'remarks'             => vsprintf(
                'Auto-created from Visa Application #%d — %s (%s)',
                [$visa->id, $visa->customer_name, $visa->visa_type]
            ),
            'branch_id'           => $visa->branch_id,
        ]);
    }
}
