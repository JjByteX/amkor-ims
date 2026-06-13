<?php

namespace Modules\Reservation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Reservation\Models\AirlineRate;

class StoreAirlineRateRequest extends FormRequest
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
            'airline'        => ['required', 'string', 'max:100'],
            'origin'         => ['required', 'string', 'max:10'],
            'destination'    => ['required', 'string', 'max:10'],
            'fare_class'     => ['nullable', 'string', 'max:30'],
            'rate'           => ['required', 'numeric', 'min:0'],
            'currency'       => ['required', 'in:' . implode(',', array_keys(AirlineRate::CURRENCIES))],
            'effective_date' => ['required', 'date'],
            'remarks'        => ['nullable', 'string'],
        ];
    }
}
