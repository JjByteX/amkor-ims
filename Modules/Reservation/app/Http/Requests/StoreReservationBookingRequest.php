<?php

namespace Modules\Reservation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Reservation\Models\ReservationBooking;

class StoreReservationBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->getRoleNames()->first();

        return in_array($role, [
            'general_manager',
            'chief_operations_officer',
            'general_sales_manager',
            'accounting_officer',
            'resa_officer',
            'ormoc_branch_officer',
        ], true);
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'agent_code' => ['nullable', 'string', 'max:20'],
            'client_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'corporate_account' => ['nullable', 'string', 'max:255'],
            'destination' => ['nullable', 'string', 'max:255'],
            'travel_date' => ['nullable', 'date'],
            'return_date' => ['nullable', 'date', 'after_or_equal:travel_date'],
            'pax_count' => ['required', 'integer', 'min:1', 'max:999'],
            'service_type' => ['required', 'in:'.implode(',', array_keys(ReservationBooking::SERVICE_TYPES))],
            'particulars' => ['nullable', 'string'],
            'inclusions' => ['nullable', 'string'],
            'exclusions' => ['nullable', 'string'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'net_payable' => ['nullable', 'numeric', 'min:0'],
            'mode_of_payment' => ['nullable', 'in:'.implode(',', array_keys(ReservationBooking::PAYMENT_MODES))],
            'payment_due_date' => ['nullable', 'date'],
            'soa_number' => ['nullable', 'string', 'max:100'],
            'po_number' => ['nullable', 'string', 'max:100'],
            'si_number' => ['nullable', 'string', 'max:100'],
            'ar_number' => ['nullable', 'string', 'max:100'],
            'or_number' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'in:'.implode(',', array_keys(ReservationBooking::STATUSES))],
            'remarks' => ['nullable', 'string'],
            'audit_remarks' => ['nullable', 'string'],
        ];
    }
}
