<?php

namespace Modules\AccountsReceivable\Listeners;

use Modules\AccountsReceivable\Models\Collectible;
use Modules\OrmocBranch\Events\OrmocBookingForwardedToAccounting;
use Modules\OrmocBranch\Models\OrmocBooking;

class CreateCollectibleFromOrmocBooking
{
    /**
     * Handle the OrmocBookingForwardedToAccounting event.
     *
     * Mirrors the reservation flow but pulls from OrmocBooking fields,
     * setting department to 'ormoc' so it lands in the correct AR bucket.
     */
    public function handle(OrmocBookingForwardedToAccounting $event): void
    {
        // Guard: idempotent — do not create a duplicate if re-fired
        $alreadyExists = Collectible::where('source_type', 'ormoc_booking')
            ->where('source_id', $event->bookingId)
            ->exists();

        if ($alreadyExists) {
            return;
        }

        $booking = OrmocBooking::find($event->bookingId);

        if (! $booking) {
            return;
        }

        Collectible::create([
            'source_type'            => 'ormoc_booking',
            'source_id'              => $booking->id,
            'department'             => 'ormoc',
            'agent_code'             => $booking->agent_code,
            'date'                   => $booking->date ?? now()->toDateString(),
            'customer_name'          => $booking->client_name,
            'corporate_account'      => null,
            'particulars'            => $booking->destination,
            'travel_date'            => $booking->travel_date,
            'collectible_amount_php' => $booking->selling_price ?? 0,
            'balance_php'            => $booking->selling_price ?? 0,
            'collectible_amount_usd' => 0,
            'balance_usd'            => 0,
            'payment_received_php'   => 0,
            'payment_received_usd'   => 0,
            'due_date'               => $booking->date_of_payment,
            'status'                 => 'current',
            'approval_status'        => 'pending',
            'ar_number'              => $booking->ar_number,
            'si_number'              => $booking->si_number,
            'or_number'              => $booking->or_number,
            'remarks'                => implode(' | ', array_filter([
                $booking->po_number  ? 'PO: '.$booking->po_number  : null,
                $booking->soa_number ? 'SOA: '.$booking->soa_number : null,
            ])),
            'branch_id'              => $booking->branch_id,
            'created_by'             => $event->actorId,
            'updated_by'             => $event->actorId,
        ]);
    }
}
