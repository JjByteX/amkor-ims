<?php

namespace Modules\BirCompliance\Listeners;

use Modules\BirCompliance\Models\BirTransaction;
use Modules\Reservation\Events\ReservationBookingConfirmed;
use Modules\Reservation\Models\ReservationBooking;

/**
 * CreateBirTransactionFromBooking
 *
 * Handles ReservationBookingConfirmed for ALL branches (QC and Ormoc).
 * Replaces both CreateBirTransactionFromReservation and CreateBirTransactionFromOrmocBooking
 * now that ormoc_bookings has been merged into reservation_bookings.
 *
 * Both QC and Ormoc now trigger BIR on confirmation (following QC's existing behaviour),
 * as confirmed with the client.
 *
 * source_type is set to 'booking' for all records (was 'ormoc' for Ormoc-origin).
 * The branch_id on the transaction correctly identifies which branch it belongs to,
 * and BirTransaction uses the branch's TIN (now stored in branches.tin) when generating
 * documents — resolving the gap where Ormoc documents showed no TIN.
 */
class CreateBirTransactionFromBooking
{
    public function handle(ReservationBookingConfirmed $event): void
    {
        // Guard: idempotent — do not create a duplicate if re-fired
        $alreadyExists = BirTransaction::where('source_type', 'booking')
            ->where('source_id', $event->bookingId)
            ->exists();

        if ($alreadyExists) {
            return;
        }

        $booking = ReservationBooking::with('contact', 'branch')->find($event->bookingId);

        if (! $booking) {
            return;
        }

        $gross       = (float) ($booking->selling_price ?? 0);
        $vatBreakdown = BirTransaction::computeVatBreakdown($gross);

        // Pull TIN, address, and business_style from the linked Contact when available.
        // Fall back to null so Accounting can fill manually.
        $contact = $booking->contact;

        // Particulars: Ormoc bookings include booking_type (domestic/international)
        // in place of service_type since they track it differently.
        $isOrmoc = $booking->branch?->code === 'ORMOC';

        $typeLabel = $isOrmoc
            ? ($booking->booking_type ? ucfirst($booking->booking_type) : null)
            : ($booking->service_type ? ucfirst($booking->service_type) : null);

        BirTransaction::create(array_merge([
            'source_type'      => 'booking',
            'source_id'        => $booking->id,
            'document_type'    => 'AR',
            'document_number'  => $booking->ar_number
                ?? BirTransaction::nextDocumentNumber('AR'),
            'client_name'      => $booking->client_name,
            'tin'              => $contact?->tin,
            'address'          => $contact?->address,
            'business_style'   => $contact?->name ?? $booking->corporate_account,
            'gross_amount'     => $gross,
            'mode_of_payment'  => $booking->mode_of_payment,
            'transaction_date' => $booking->date ?? now()->toDateString(),
            'due_date'         => $booking->payment_due_date ?? $booking->date_of_payment,
            'year'             => ($booking->date ?? now())->year,
            'month'            => ($booking->date ?? now())->month,
            'bir_atp_number'   => BirTransaction::BIR_ATP_NUMBER,
            'particulars'      => implode(' | ', array_filter([
                $booking->destination,
                $typeLabel,
                $booking->booking_no ? 'Booking#: '.$booking->booking_no : null,
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
