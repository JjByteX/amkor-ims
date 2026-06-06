<?php

namespace Modules\Disbursement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'                => ['required', 'in:cash,check'],
            'date'                => ['required', 'date'],
            'payee'               => ['required', 'string', 'max:255'],
            'payee_address'       => ['nullable', 'string', 'max:500'],
            'check_no'            => ['nullable', 'string', 'max:100'],
            'bank_name'           => ['nullable', 'string', 'max:100'],
            'check_date'          => ['nullable', 'date'],
            'details'             => ['nullable', 'string'],
            'account_code'        => ['nullable', 'string', 'max:100'],
            'account_description' => ['nullable', 'string', 'max:255'],
            'currency'            => ['required', 'in:PHP,USD,JPY'],
            'amount'              => ['required', 'numeric', 'min:0'],
            'amount_usd'          => ['nullable', 'numeric', 'min:0'],
            'amount_jpy'          => ['nullable', 'numeric', 'min:0'],
            'remarks'             => ['nullable', 'string'],
        ];
    }
}