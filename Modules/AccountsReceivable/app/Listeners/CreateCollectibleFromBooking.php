<?php

namespace Modules\AccountsReceivable\Listeners;

use Modules\AccountsReceivable\Models\Collectible;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Reservation\Models\ReservationBooking;

/**
 * CreateCollectibleFromBooking
 *
 * Handles ReservationForwardedToAccounting for ALL branches (QC and Ormoc).
 * Replaces both CreateCollectibleFromReservation and CreateCollectibleFromOrmocBooking
 * now that ormoc_bookings has been merged into reservation_bookings.
 *
 * Department is set to 'ormoc' for Ormoc-origin bookings and 'resa' for QC,
 * so the AR list buckets remain unchanged from the user's perspective.
 */
class CreateCollectibleFromBooking
{
    public function handle(ReservationForwardedToAccounting $event): void
    {
        // Guard: idempotent — do not create a duplicate if re-fired
        $alreadyExists = Collectible::where('source_type', 'reservation')
            ->where('source_id', $event->bookingId)
            ->exists();

        if ($alreadyExists) {
            return;
        }

        $booking = ReservationBooking::with('branch')->find($event->bookingId);

        if (! $booking) {
            return;
        }

        $isOrmoc     = $booking->branch?->code === 'ORMOC';
        $department  = $isOrmoc ? 'ormoc' : 'resa';

        // Ormoc uses date_of_payment as the effective due date;
        // QC uses payment_due_date.
        $dueDate = $isOrmoc
            ? ($booking->date_of_payment ?? $booking->payment_due_date)
            : $booking->payment_due_date;

        Collectible::create([
            'source_type'            => 'reservation',
            'source_id'              => $booking->id,
            'department'             => $department,
            'agent_code'             => $booking->agent_code,
            'date'                   => $booking->date ?? now()->toDateString(),
            'customer_name'          => $booking->client_name,
            'corporate_account'      => $booking->corporate_account,
            'particulars'            => $booking->destination,
            'travel_date'            => $booking->travel_date,
            'collectible_amount_php' => $booking->selling_price ?? 0,
            'balance_php'            => $booking->selling_price ?? 0,
            'collectible_amount_usd' => 0,
            'balance_usd'            => 0,
            'payment_received_php'   => 0,
            'payment_received_usd'   => 0,
            'due_date'               => $dueDate,
            'status'                 => 'current',
            'approval_status'        => 'pending',
            'ar_number'              => $booking->ar_number,
            'si_number'              => $booking->si_number,
            'or_number'              => $booking->or_number,
            'remarks'                => implode(' | ', array_filter([
                $booking->po_number  ? 'PO: '.$booking->po_number  : null,
                $booking->soa_number ? 'SOA: '.$booking->soa_number : null,
                $booking->booking_no ? 'Booking: '.$booking->booking_no : null,
            ])),
            'branch_id'              => $booking->branch_id,
            'created_by'             => $event->actorId,
            'updated_by'             => $event->actorId,
        ]);
    }
}
