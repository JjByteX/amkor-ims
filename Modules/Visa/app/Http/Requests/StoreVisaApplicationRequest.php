<?php

namespace Modules\Visa\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Visa\Models\VisaApplication;

class StoreVisaApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Role enforcement in controller
    }

    public function rules(): array
    {
        $validStatuses = array_keys(VisaApplication::STATUSES);
        $validModes    = array_keys(VisaApplication::PAYMENT_MODES);

        return [
            'agent_code'      => ['required', 'string', 'max:10'],
            'date'            => ['required', 'date'],
            'agency'          => ['nullable', 'string', 'max:255'],

            // Contact link — optional; auto-fills TIN/address/business_style in BIR
            'contact_id'      => ['nullable', 'integer', 'exists:contacts,id'],

            'customer_name'   => ['required', 'string', 'max:255'],
            'visa_type'       => ['required', 'string', 'max:100'],
            'selling_price'   => ['nullable', 'numeric', 'min:0'],
            'net_payable'     => ['nullable', 'numeric', 'min:0'],
            'income'          => ['nullable', 'numeric'],
            'status'          => ['nullable', 'in:'.implode(',', $validStatuses)],
            'notes'           => ['nullable', 'string'],
            'mode_of_payment' => ['nullable', 'in:'.implode(',', $validModes)],
            'payment_date'    => ['nullable', 'date'],
            'soa_number'      => ['nullable', 'string', 'max:100'],
            'si_number'       => ['nullable', 'string', 'max:100'],
            'ar_number'       => ['nullable', 'string', 'max:100'],
            'payment_due_date'=> ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'agent_code.required'    => 'Please select an agent.',
            'customer_name.required' => 'Customer name is required.',
            'visa_type.required'     => 'Please select a visa or service type.',
            'contact_id.exists'      => 'The selected contact does not exist.',
        ];
    }
}
