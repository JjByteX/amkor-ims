<?php

namespace Modules\Reservation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Reservation\Models\ReservationBooking;

class StoreReservationBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Role enforcement is handled in the controller
        return true;
    }

    public function rules(): array
    {
        return [
            // Core
            'date'              => ['required', 'date'],
            'agent_code'        => ['nullable', 'string', 'max:20'],
            'status'            => ['required', 'in:'.implode(',', array_keys(ReservationBooking::STATUSES))],

            // Client
            'client_name'       => ['required', 'string', 'max:255'],
            'contact_person'    => ['nullable', 'string', 'max:255'], // Phase 2.1 — corporate travel coordinator
            'date_of_birth'     => ['nullable', 'date'],
            'contact_number'    => ['nullable', 'string', 'max:50'],
            'email'             => ['nullable', 'email', 'max:255'],
            'corporate_account' => ['nullable', 'string', 'max:255'],
            'contact_id'        => ['nullable', 'integer', 'exists:contacts,id'],

            // Trip — QC fields
            'destination'       => ['nullable', 'string', 'max:255'],
            'airline'           => ['nullable', 'string', 'max:100'],
            'travel_date'       => ['nullable', 'date'],
            'return_date'       => ['nullable', 'date', 'after_or_equal:travel_date'],
            'pax_count'         => ['required', 'integer', 'min:1', 'max:9999'],
            'service_type'      => ['required', 'in:'.implode(',', array_keys(ReservationBooking::SERVICE_TYPES))],
            'transaction_type'  => ['nullable', 'in:'.implode(',', array_keys(ReservationBooking::TRANSACTION_TYPES))],
            'source'            => ['nullable', 'string', 'max:100'],
            'particulars'       => ['nullable', 'string'],
            'inclusions'        => ['nullable', 'string'],
            'exclusions'        => ['nullable', 'string'],

            // Trip — Ormoc-specific (nullable for QC bookings)
            'booking_type'      => ['nullable', 'in:'.implode(',', array_keys(ReservationBooking::BOOKING_TYPES))],
            'hotel'             => ['nullable', 'string', 'max:255'],
            'room_type'         => ['nullable', 'string', 'max:100'],
            'flight_details'    => ['nullable', 'string'],
            'passport_expiry'   => ['nullable', 'date'],

            // Financials
            'selling_price'     => ['nullable', 'numeric', 'min:0'],
            'net_payable'       => ['nullable', 'numeric', 'min:0'],
            'income'            => ['nullable', 'numeric'],
            'excess'            => ['nullable', 'numeric'],
            'insurance_nett'    => ['nullable', 'numeric', 'min:0'],
            'acr'               => ['nullable', 'string', 'max:100'],

            // Payment
            'mode_of_payment'   => ['nullable', 'in:'.implode(',', array_keys(ReservationBooking::PAYMENT_MODES))],
            'payment_due_date'  => ['nullable', 'date'],
            'date_of_payment'   => ['nullable', 'date'],

            // Document references
            'soa_number'        => ['nullable', 'string', 'max:100'],
            'po_number'         => ['nullable', 'string', 'max:100'],
            'si_number'         => ['nullable', 'string', 'max:100'],
            'ar_number'         => ['nullable', 'string', 'max:100'],
            'or_number'         => ['nullable', 'string', 'max:100'],

            // Notes & audit
            'remarks'           => ['nullable', 'string'],
            'audit_remarks'     => ['nullable', 'string'],
            'notes'             => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'contact_id.exists'          => 'The selected contact does not exist.',
            'return_date.after_or_equal' => 'Return date must be on or after the travel date.',
        ];
    }
}
