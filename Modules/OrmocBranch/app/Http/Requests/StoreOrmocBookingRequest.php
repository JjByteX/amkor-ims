<?php

namespace Modules\OrmocBranch\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\OrmocBranch\Models\OrmocBooking;

class StoreOrmocBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Role enforcement handled in controller
    }

    public function rules(): array
    {
        $validStatuses = array_keys(OrmocBooking::STATUSES);
        $validBookingTypes = array_keys(OrmocBooking::BOOKING_TYPES);
        $validPaymentModes = array_keys(OrmocBooking::PAYMENT_MODES);

        return [
            // Core
            'agent_code' => ['required', 'string', 'max:10'],
            'date' => ['required', 'date'],
            'client_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],

            // Booking type
            'booking_type' => ['nullable', 'in:'.implode(',', $validBookingTypes)],

            // Inquiry / quotation
            'destination' => ['nullable', 'string', 'max:255'],
            'travel_date' => ['nullable', 'date'],
            'pax_count' => ['nullable', 'integer', 'min:1', 'max:9999'],

            // Package details
            'hotel' => ['nullable', 'string', 'max:255'],
            'room_type' => ['nullable', 'string', 'max:100'],
            'flight_details' => ['nullable', 'string'],
            'inclusions' => ['nullable', 'string'],
            'exclusions' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],

            // Financials
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'net_payable' => ['nullable', 'numeric', 'min:0'],
            'income' => ['nullable', 'numeric'],
            'excess' => ['nullable', 'numeric'],
            'insurance_nett' => ['nullable', 'numeric', 'min:0'],
            'acr' => ['nullable', 'numeric', 'min:0'],

            // Payment
            'mode_of_payment' => ['nullable', 'in:'.implode(',', $validPaymentModes)],
            'date_of_payment' => ['nullable', 'date'],

            // References
            'po_number' => ['nullable', 'string', 'max:100'],
            'si_number' => ['nullable', 'string', 'max:100'],
            'or_number' => ['nullable', 'string', 'max:100'],
            'ar_number' => ['nullable', 'string', 'max:100'],
            'soa_number' => ['nullable', 'string', 'max:100'],

            // Tracking
            'transaction_type' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:100'],
            'audit_remarks' => ['nullable', 'string'],
            'status' => ['nullable', 'in:'.implode(',', $validStatuses)],

            // Passport
            'passport_expiry' => ['nullable', 'date'],

            // Notes
            'notes' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'agent_code.required' => 'Please select an agent.',
            'client_name.required' => 'Client name is required.',
            'date.required' => 'Booking date is required.',
        ];
    }
}
