<?php

namespace Modules\BirCompliance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBirTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Role check is done in controller
    }

    public function rules(): array
    {
        return [
            'document_type' => ['required', 'in:AR,SI,SOA'],
            'document_number' => ['nullable', 'string', 'max:100'],
            'source_type' => ['nullable', 'string', 'max:50'],
            'source_id' => ['nullable', 'integer'],
            'client_name' => ['required', 'string', 'max:255'],
            'tin' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'business_style' => ['nullable', 'string', 'max:255'],
            'gross_amount' => ['required', 'numeric', 'min:0'],
            'sc_pwd_discount' => ['nullable', 'numeric', 'min:0'],
            'withholding_tax' => ['nullable', 'numeric', 'min:0'],
            'is_vat_exempt' => ['nullable', 'boolean'],
            'is_vat_zero_rated' => ['nullable', 'boolean'],
            'mode_of_payment' => ['nullable', 'string', 'max:50'],
            'check_number' => ['nullable', 'string', 'max:100'],
            'transaction_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'particulars' => ['nullable', 'string', 'max:500'],
            'remarks' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'document_type.required' => 'Document type is required.',
            'client_name.required' => 'Client name is required.',
            'gross_amount.required' => 'Amount is required.',
            'transaction_date.required' => 'Transaction date is required.',
            'tin.required_if' => 'TIN is required for AR and SI documents.',
        ];
    }
}
