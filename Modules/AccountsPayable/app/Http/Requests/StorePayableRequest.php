<?php

namespace Modules\AccountsPayable\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePayableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // controller enforces role
    }

    public function rules(): array
    {
        return [
            'requisition_no'      => ['nullable', 'string', 'max:100'],
            'invoice_date'        => ['nullable', 'date'],
            'invoice_no'          => ['nullable', 'string', 'max:100'],
            'contact_id'          => ['nullable', 'integer', 'exists:contacts,id'],
            'supplier_name'       => ['required', 'string', 'max:255'],
            'currency'            => ['required', 'in:PHP,USD,JPY'],
            'invoice_amount_php'  => ['nullable', 'numeric', 'min:0'],
            'invoice_amount_usd'  => ['nullable', 'numeric', 'min:0'],
            'invoice_amount_jpy'  => ['nullable', 'numeric', 'min:0'],
            'payment_php'         => ['nullable', 'numeric', 'min:0'],
            'payment_usd'         => ['nullable', 'numeric', 'min:0'],
            'payment_jpy'         => ['nullable', 'numeric', 'min:0'],
            'due_date'            => ['nullable', 'date'],
            'payment_date'        => ['nullable', 'date'],
            'mode_of_payment'     => ['nullable', 'in:cash,check,bank_deposit'],
            'account_no'          => ['nullable', 'string', 'max:100'],
            'acr'                 => ['nullable', 'string', 'max:100'],
            'check_no'            => ['nullable', 'string', 'max:100'],
            'remarks'             => ['nullable', 'string'],
        ];
    }
}