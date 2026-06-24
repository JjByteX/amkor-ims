<?php

namespace Modules\EmployeeRecords\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    // All 17 valid role slugs — must stay in sync with AuthDatabaseSeeder
    private const VALID_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'accounting_assistant',
        'liaison_officer_finance',
        'general_sales_manager',
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'business_development_manager',
        'sales_marketing_officer',
        'visa_documentation_supervisor',
        'liaison_officer_visa',
        'visa_documentation_officer',
        'branch_supervisor',
        'branch_sales_officer',
    ];

    /**
     * Role hierarchy — a user can only assign roles at or below their own level.
     * Lower index = higher authority. A creator can only assign roles with an
     * index GREATER THAN OR EQUAL TO their own index.
     *
     * president (0) can assign any role.
     * finance_admin_supervisor (2) can assign roles 2–16 only.
     */
    public const ROLE_HIERARCHY = [
        0  => 'president',
        1  => 'chief_operating_officer',
        2  => 'finance_admin_supervisor',
        3  => 'administrative_assistant',
        4  => 'accounting_assistant',
        5  => 'liaison_officer_finance',
        6  => 'general_sales_manager',
        7  => 'sales_reservation_officer',
        8  => 'sales_ticketing_officer',
        9  => 'group_sales_officer',
        10 => 'business_development_manager',
        11 => 'sales_marketing_officer',
        12 => 'visa_documentation_supervisor',
        13 => 'liaison_officer_visa',
        14 => 'visa_documentation_officer',
        15 => 'branch_supervisor',
        16 => 'branch_sales_officer',
    ];

    public function authorize(): bool
    {
        $role = $this->user()?->getRoleNames()->first();

        // Only president and finance_admin_supervisor can create employees
        return in_array($role, ['president', 'finance_admin_supervisor'], true);
    }

    /**
     * Return the roles this user is allowed to assign as a system login role.
     * Called by EmployeeRecordsController::create() to filter the dropdown.
     */
    public static function assignableRoles(string $creatorRole): array
    {
        $hierarchy = array_flip(self::ROLE_HIERARCHY); // role => index
        $creatorIndex = $hierarchy[$creatorRole] ?? PHP_INT_MAX;

        return array_filter(
            self::ROLE_HIERARCHY,
            fn ($role, $index) => $index >= $creatorIndex,
            ARRAY_FILTER_USE_BOTH
        );
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')?->id;

        return [
            // Required personal
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'suffix'      => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'gender'        => ['nullable', 'string', 'in:Male,Female,Other'],
            'civil_status'  => ['nullable', 'string', 'in:Single,Married,Widowed,Separated'],

            // Employment
            'employee_code'    => ['nullable', 'string', 'max:50', "unique:employees,employee_code,{$employeeId}"],
            'position'         => ['required', 'string', 'max:150'],
            'department'       => ['nullable', 'string', 'max:100'],
            'branch_id'        => ['nullable', 'integer', 'exists:branches,id'],
            'employment_status' => ['required', 'string', 'in:probationary,regular,resigned,terminated'],
            'date_hired'        => ['required', 'date'],
            'regularization_date' => ['nullable', 'date', 'after_or_equal:date_hired'],

            // Gov IDs
            'sss_number'       => ['nullable', 'string', 'max:50'],
            'philhealth_number' => ['nullable', 'string', 'max:50'],
            'pagibig_number'   => ['nullable', 'string', 'max:50'],
            'tin_number'       => ['nullable', 'string', 'max:50'],

            // Contact
            // work_email doubles as the system login email when a login is being created.
            // If login_role is provided, work_email becomes required and must be unique in users.
            'work_email' => [
                'nullable',
                'email',
                'max:255',
                'required_with:login_role',
                "unique:users,email,{$this->route('employee')?->user_id}",
            ],
            'personal_email' => ['nullable', 'email', 'max:255'],
            'mobile_number'  => ['nullable', 'string', 'max:30'],
            'home_address'   => ['nullable', 'string'],

            // Emergency
            'emergency_contact_name'         => ['nullable', 'string', 'max:150'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:80'],
            'emergency_contact_number'       => ['nullable', 'string', 'max:30'],

            // SIL
            'sil_total' => ['nullable', 'integer', 'min:0', 'max:365'],
            'sil_used'  => ['nullable', 'integer', 'min:0'],

            // Uniform records
            'uniform_records'         => ['nullable', 'array'],
            'uniform_records.*.date'  => ['nullable', 'date'],
            'uniform_records.*.item'  => ['nullable', 'string', 'max:100'],
            'uniform_records.*.size'  => ['nullable', 'string', 'max:20'],
            'uniform_records.*.qty'   => ['nullable', 'integer', 'min:1'],
            'uniform_records.*.notes' => ['nullable', 'string', 'max:255'],

            // Compliance
            'data_privacy_consent'      => ['nullable', 'boolean'],
            'data_privacy_consent_date' => ['nullable', 'date'],

            // Agent
            'is_agent'   => ['nullable', 'boolean'],
            'agent_code' => [
                'nullable',
                'string',
                'max:5',
                'regex:/^[A-Z0-9]+$/',
                "unique:employees,agent_code,{$employeeId}",
                function ($attribute, $value, $fail) {
                    if ($value && in_array(strtoupper($value), \Modules\EmployeeRecords\Models\Employee::RESERVED_AGENT_CODES, true)) {
                        $fail("'{$value}' is a reserved code and cannot be assigned to an individual.");
                    }
                },
            ],

            // Other
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'remarks' => ['nullable', 'string'],

            // Salary increase
            'salary_increase_amount' => ['nullable', 'numeric', 'min:0'],
            'salary_increase_date'   => ['nullable', 'date'],

            // Extended fields
            'id_number'             => ['nullable', 'string', 'max:50'],
            'nickname'              => ['nullable', 'string', 'max:100'],
            'bank_account_number'   => ['nullable', 'string', 'max:100'],
            'bank_name'             => ['nullable', 'string', 'max:100'],
            'maturity_date'         => ['nullable', 'date'],
            'last_evaluation_date'  => ['nullable', 'date'],
            'vl_fund'               => ['nullable', 'numeric', 'min:0'],
            'vl_fund_date'          => ['nullable', 'date'],
            'philcare_number'       => ['nullable', 'string', 'max:100'],
            'medicard_number'       => ['nullable', 'string', 'max:100'],
            'company_viber_number'  => ['nullable', 'string', 'max:50'],
            'company_email_outlook' => ['nullable', 'email', 'max:255'],

            // ── System Access (create only) ───────────────────────────────────
            // Role and password are optional. If login_role is provided then
            // work_email (above) becomes required and must be unique in users.
            'login_role'     => [
                'nullable',
                'string',
                'in:' . implode(',', self::VALID_ROLES),
                // Role hierarchy guard — cannot assign a role above your own level
                function ($attribute, $value, $fail) {
                    if (! $value) return;
                    $creatorRole = $this->user()?->getRoleNames()->first();
                    $assignable  = self::assignableRoles($creatorRole);
                    if (! in_array($value, $assignable, true)) {
                        $fail('You cannot assign a role above your own authority level.');
                    }
                },
            ],
            'login_password' => ['nullable', 'string', 'required_with:login_role', 'min:8', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required'          => 'First name is required.',
            'last_name.required'           => 'Last name is required.',
            'position.required'            => 'Position is required.',
            'employment_status.required'   => 'Employment status is required.',
            'date_hired.required'          => 'Date hired is required.',
            'employee_code.unique'         => 'This employee code is already in use.',
            'agent_code.unique'            => 'This agent code is already assigned to another employee.',
            'agent_code.max'               => 'Agent code must be 5 characters or fewer.',
            'agent_code.regex'             => 'Agent code may only contain uppercase letters and numbers.',
            // work_email errors that relate to system access
            'work_email.required_with'     => 'Work email is required when creating a system login — it is used as the login address.',
            'work_email.unique'            => 'This email is already registered as a system login.',
            'login_password.required_with' => 'A temporary password is required when creating a system login.',
            'login_password.min'           => 'Temporary password must be at least 8 characters.',
        ];
    }
}
