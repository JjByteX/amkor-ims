<?php

namespace Modules\BirCompliance\Listeners;

use Modules\BirCompliance\Models\BirTransaction;
use Modules\Visa\Events\VisaOrReceived;
use Modules\Visa\Models\VisaApplication;

class CreateBirTransactionFromVisaOr
{
    /**
     * Handle the VisaOrReceived event.
     *
     * Creates a BIR SI transaction when an OR number is recorded on a visa
     * application. The SI document type is used because an OR has been issued,
     * meaning the transaction is complete and BIR-reportable.
     * Idempotent — safe to re-fire.
     *
     * When a contact_id is linked, TIN, address, and business_style are pulled
     * directly from the Contact record so Accounting no longer needs to fill
     * them in manually from Excel.
     */
    public function handle(VisaOrReceived $event): void
    {
        // Guard: skip if a BIR record already exists for this visa application
        $alreadyExists = BirTransaction::where('source_type', 'visa')
            ->where('source_id', $event->visaId)
            ->exists();

        if ($alreadyExists) {
            return;
        }

        $visa = VisaApplication::with('contact')->find($event->visaId);

        if (! $visa) {
            return;
        }

        $gross = (float) ($visa->selling_price ?? 0);

        // Standard 12% VAT breakdown — visa service fees are VATable
        $vatBreakdown = BirTransaction::computeVatBreakdown($gross);

        // Pull TIN, address, and business_style from the linked Contact when
        // available; fall back to null so Accounting can fill manually.
        $contact = $visa->contact;

        BirTransaction::create(array_merge([
            'source_type'      => 'visa',
            'source_id'        => $visa->id,
            'document_type'    => 'SI',
            'document_number'  => $visa->si_number
                ?? BirTransaction::nextDocumentNumber('SI'),
            'client_name'      => $visa->customer_name,
            'tin'              => $contact?->tin,
            'address'          => $contact?->address,
            'business_style'   => $contact?->name ?? $visa->agency,
            'gross_amount'     => $gross,
            'mode_of_payment'  => $visa->mode_of_payment,
            'transaction_date' => $visa->payment_date ?? $visa->date ?? now()->toDateString(),
            'due_date'         => $visa->payment_due_date,
            'year'             => ($visa->payment_date ?? $visa->date ?? now())->year,
            'month'            => ($visa->payment_date ?? $visa->date ?? now())->month,
            'bir_atp_number'   => BirTransaction::BIR_ATP_NUMBER,
            'particulars'      => $visa->visa_type,
            'remarks'          => implode(' | ', array_filter([
                $event->orNumber            ? 'OR: '.$event->orNumber      : null,
                $visa->ar_number            ? 'AR: '.$visa->ar_number      : null,
                $visa->soa_number           ? 'SOA: '.$visa->soa_number    : null,
                $visa->agent_code           ? 'Agent: '.$visa->agent_code  : null,
            ])),
            'branch_id'        => $visa->branch_id,
            'created_by'       => $event->actorId,
            'updated_by'       => $event->actorId,
        ], $vatBreakdown));
    }
}
