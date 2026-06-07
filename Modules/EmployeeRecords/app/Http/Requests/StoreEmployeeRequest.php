<?php

namespace Modules\EmployeeRecords\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->getRoleNames()->first();

        return in_array($role, ['hr_admin_officer', 'general_manager'], true);
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')?->id;

        return [
            // Required personal
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:Male,Female,Other'],
            'civil_status' => ['nullable', 'string', 'in:Single,Married,Widowed,Separated'],

            // Employment
            'employee_code' => ['nullable', 'string', 'max:50', "unique:employees,employee_code,{$employeeId}"],
            'position' => ['required', 'string', 'max:150'],
            'department' => ['nullable', 'string', 'max:100'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'employment_status' => ['required', 'string', 'in:probationary,regular,resigned,terminated'],
            'date_hired' => ['required', 'date'],
            'regularization_date' => ['nullable', 'date', 'after_or_equal:date_hired'],

            // Gov IDs
            'sss_number' => ['nullable', 'string', 'max:50'],
            'philhealth_number' => ['nullable', 'string', 'max:50'],
            'pagibig_number' => ['nullable', 'string', 'max:50'],
            'tin_number' => ['nullable', 'string', 'max:50'],

            // Contact
            'personal_email' => ['nullable', 'email', 'max:255'],
            'work_email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:30'],
            'home_address' => ['nullable', 'string'],

            // Emergency
            'emergency_contact_name' => ['nullable', 'string', 'max:150'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:80'],
            'emergency_contact_number' => ['nullable', 'string', 'max:30'],

            // SIL
            'sil_total' => ['nullable', 'integer', 'min:0', 'max:365'],
            'sil_used' => ['nullable', 'integer', 'min:0'],

            // Uniform records — array of objects
            'uniform_records' => ['nullable', 'array'],
            'uniform_records.*.date' => ['nullable', 'date'],
            'uniform_records.*.item' => ['nullable', 'string', 'max:100'],
            'uniform_records.*.size' => ['nullable', 'string', 'max:20'],
            'uniform_records.*.qty' => ['nullable', 'integer', 'min:1'],
            'uniform_records.*.notes' => ['nullable', 'string', 'max:255'],

            // Compliance
            'data_privacy_consent' => ['nullable', 'boolean'],
            'data_privacy_consent_date' => ['nullable', 'date'],

            // Other
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'remarks' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'position.required' => 'Position is required.',
            'employment_status.required' => 'Employment status is required.',
            'date_hired.required' => 'Date hired is required.',
            'employee_code.unique' => 'This employee code is already in use.',
        ];
    }
}
