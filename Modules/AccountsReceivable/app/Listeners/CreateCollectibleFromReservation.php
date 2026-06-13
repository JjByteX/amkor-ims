<?php

namespace Modules\AccountsReceivable\Listeners;

use Modules\AccountsReceivable\Models\Collectible;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Reservation\Models\ReservationBooking;

class CreateCollectibleFromReservation
{
    /**
     * Handle the ReservationForwardedToAccounting event.
     *
     * Reads the full booking record and creates a Collectible in AR so
     * the accounting officer finds it pre-populated — no manual entry needed.
     */
    public function handle(ReservationForwardedToAccounting $event): void
    {
        // Guard: skip if a collectible already exists for this booking
        // (idempotency — safe to re-fire without creating duplicates)
        $alreadyExists = Collectible::where('source_type', 'reservation')
            ->where('source_id', $event->bookingId)
            ->exists();

        if ($alreadyExists) {
            return;
        }

        $booking = ReservationBooking::find($event->bookingId);

        if (! $booking) {
            return;
        }

        Collectible::create([
            'source_type'            => 'reservation',
            'source_id'              => $booking->id,
            'department'             => 'resa',
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
            'due_date'               => $booking->payment_due_date,
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
