<?php

namespace Modules\BirCompliance\Listeners;

use Modules\BirCompliance\Models\BirTransaction;
use Modules\OrmocBranch\Events\OrmocBookingForwardedToAccounting;
use Modules\OrmocBranch\Models\OrmocBooking;

class CreateBirTransactionFromOrmocBooking
{
    /**
     * Handle the OrmocBookingForwardedToAccounting event.
     *
     * Creates a BIR AR transaction automatically when an Ormoc booking is
     * forwarded to accounting. Mirrors the Reservation listener pattern.
     * Idempotent — safe to re-fire.
     *
     * When a contact_id is linked, TIN, address, and business_style are pulled
     * directly from the Contact record so Accounting no longer needs to fill
     * them in manually from Excel.
     */
    public function handle(OrmocBookingForwardedToAccounting $event): void
    {
        // Guard: skip if a BIR record already exists for this booking
        $alreadyExists = BirTransaction::where('source_type', 'ormoc')
            ->where('source_id', $event->bookingId)
            ->exists();

        if ($alreadyExists) {
            return;
        }

        $booking = OrmocBooking::with('contact')->find($event->bookingId);

        if (! $booking) {
            return;
        }

        $gross = (float) ($booking->selling_price ?? 0);

        // Standard 12% VAT breakdown — all travel agency service fees are VATable
        $vatBreakdown = BirTransaction::computeVatBreakdown($gross);

        // Pull TIN, address, and business_style from the linked Contact when
        // available; fall back to null so Accounting can fill manually.
        $contact = $booking->contact;

        BirTransaction::create(array_merge([
            'source_type'      => 'ormoc',
            'source_id'        => $booking->id,
            'document_type'    => 'AR',
            'document_number'  => $booking->ar_number
                ?? BirTransaction::nextDocumentNumber('AR'),
            'client_name'      => $booking->client_name,
            'tin'              => $contact?->tin,
            'address'          => $contact?->address,
            'business_style'   => $contact?->name,
            'gross_amount'     => $gross,
            'mode_of_payment'  => $booking->mode_of_payment,
            'transaction_date' => $booking->date ?? now()->toDateString(),
            'due_date'         => null,
            'year'             => ($booking->date ?? now())->year,
            'month'            => ($booking->date ?? now())->month,
            'bir_atp_number'   => BirTransaction::BIR_ATP_NUMBER,
            'particulars'      => implode(' | ', array_filter([
                $booking->destination,
                $booking->booking_type ? ucfirst($booking->booking_type) : null,
            ])),
            'remarks'          => implode(' | ', array_filter([
                $booking->si_number  ? 'SI: '.$booking->si_number  : null,
                $booking->soa_number ? 'SOA: '.$booking->soa_number : null,
                $booking->po_number  ? 'PO: '.$booking->po_number  : null,
            ])),
            'branch_id'        => $booking->branch_id,
            'created_by'       => $event->actorId,
            'updated_by'       => $event->actorId,
        ], $vatBreakdown));
    }
}
