<?php

namespace Modules\Disbursement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDisbursementEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'category' => ['required', 'in:cash,check,liaison_admin,liaison_banks'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'voucher_id' => ['nullable', 'integer', 'exists:vouchers,id'],
            'payee' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'account_code' => ['nullable', 'string', 'max:100'],
            'currency' => ['required', 'in:PHP,USD,JPY'],
            'amount' => ['required', 'numeric', 'min:0'],
            'fund_type' => ['required', 'in:cash_on_hand,cash_on_bank,petty_cash'],
            'remarks' => ['nullable', 'string'],
            'access_file_period' => ['nullable', 'date'],
        ];
    }
}
