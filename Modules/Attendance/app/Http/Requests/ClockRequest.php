<?php

namespace Modules\Attendance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * ClockRequest — validates clock-in / clock-out POST requests.
 *
 * The controller imports this class for clockIn() and clockOut() but
 * those methods receive the standard Request — no special validation
 * needed beyond CSRF (handled by middleware). This class exists to
 * satisfy the import so the module doesn't throw a class-not-found
 * fatal during route registration.
 */
class ClockRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any authenticated user may clock in/out for themselves.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        // No input required — clock time is captured server-side via now().
        return [];
    }
}
