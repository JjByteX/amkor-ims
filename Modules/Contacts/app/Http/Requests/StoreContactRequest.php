<?php

namespace Modules\Contacts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Contacts\Models\Contact;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Checked in controller via permission middleware
        return true;
    }

    public function rules(): array
    {
        $contactId = $this->route('contact')?->id;

        return [
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(Contact::TYPES))],
            'name' => ['required', 'string', 'max:255'],
            'tin' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'in:'.implode(',', Contact::CURRENCIES)],
            'account_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Contact type must be one of: Corporate Account, Sub-Agent, Supplier, or Bank.',
            'currency.in' => 'Currency must be PHP, USD, or JPY.',
        ];
    }
}
