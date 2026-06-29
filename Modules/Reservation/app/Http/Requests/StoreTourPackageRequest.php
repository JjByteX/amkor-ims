<?php

namespace Modules\Reservation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTourPackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Role enforcement is handled in TourPackageController
        return true;
    }

    public function rules(): array
    {
        return [
            // Identity
            'country'         => ['required', 'string', 'max:100'],
            'package_name'    => ['required', 'string', 'max:255'],
            'destinations'    => ['nullable', 'string', 'max:255'],
            'duration_days'   => ['nullable', 'integer', 'min:1', 'max:365'],
            'duration_nights' => ['nullable', 'integer', 'min:0', 'max:364'],

            // Booking form autofill
            'particulars'     => ['nullable', 'string'],
            'inclusions'      => ['nullable', 'string'],
            'exclusions'      => ['nullable', 'string'],
            'airline'         => ['nullable', 'string', 'max:255'],

            // Pricing tiers — array of {min_pax, price} objects in USD
            // Example: [{"min_pax": 15, "price": 4480}, {"min_pax": 20, "price": 4100}]
            'tour_costs'                  => ['nullable', 'array'],
            'tour_costs.*.min_pax'        => ['required_with:tour_costs', 'integer', 'min:1'],
            'tour_costs.*.price'          => ['required_with:tour_costs', 'numeric', 'min:0'],

            // Departure dates — array of {date, surcharge} objects
            // Example: [{"date": "2026-08-30", "surcharge": 0}, {"date": "2026-09-06", "surcharge": 20}]
            'departure_dates'             => ['nullable', 'array'],
            'departure_dates.*.date'      => ['required_with:departure_dates', 'date'],
            'departure_dates.*.surcharge' => ['required_with:departure_dates', 'numeric', 'min:0'],

            'is_active'       => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'tour_costs.*.min_pax.required_with'        => 'Each cost tier must have a minimum pax value.',
            'tour_costs.*.price.required_with'           => 'Each cost tier must have a price.',
            'departure_dates.*.date.required_with'       => 'Each departure entry must have a date.',
            'departure_dates.*.surcharge.required_with'  => 'Each departure entry must have a surcharge (use 0 if none).',
        ];
    }
}
