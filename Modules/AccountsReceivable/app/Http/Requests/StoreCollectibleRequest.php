<?php

namespace Modules\AccountsReceivable\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCollectibleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'department'              => ['required', 'in:resa,visa,ormoc'],
            'agent_code'              => ['nullable', 'string', 'max:20'],
            'date'                    => ['required', 'date'],
            'contact_id'              => ['nullable', 'integer', 'exists:contacts,id'],
            'customer_name'           => ['required', 'string', 'max:255'],
            'corporate_account'       => ['nullable', 'string', 'max:255'],
            'particulars'             => ['nullable', 'string'],
            'travel_date'             => ['nullable', 'date'],
            'terms'                   => ['nullable', 'string', 'max:100'],
            'collectible_amount_php'  => ['nullable', 'numeric', 'min:0'],
            'collectible_amount_usd'  => ['nullable', 'numeric', 'min:0'],
            'payment_received_php'    => ['nullable', 'numeric', 'min:0'],
            'payment_received_usd'    => ['nullable', 'numeric', 'min:0'],
            'due_date'                => ['nullable', 'date'],
            'or_number'               => ['nullable', 'string', 'max:100'],
            'ar_number'               => ['nullable', 'string', 'max:100'],
            'si_number'               => ['nullable', 'string', 'max:100'],
            'remarks'                 => ['nullable', 'string'],
            'audit_remarks'           => ['nullable', 'string'],
        ];
    }
}