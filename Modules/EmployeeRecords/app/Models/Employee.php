<?php

namespace Modules\EmployeeRecords\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        // ── Identity ──────────────────────────────────────────────────────────
        'id_number',                    // Added — printed employee ID (e.g. AMK-2024-001)
        'first_name',
        'last_name',
        'middle_name',
        'suffix',
        'nickname',                     // Added — call name / display name
        'date_of_birth',
        'gender',
        'civil_status',

        // ── Employment ────────────────────────────────────────────────────────
        'employee_code',
        'position',
        'department',
        'branch_id',
        'employment_status',
        'date_hired',
        'regularization_date',
        'maturity_date',                // Added — end of probationary period
        'last_evaluation_date',         // Added — last performance review date

        // ── Government IDs ────────────────────────────────────────────────────
        'sss_number',
        'philhealth_number',
        'pagibig_number',
        'tin_number',
        'philcare_number',              // Added — PhilCare HMO number
        'medicard_number',              // Added — Medicard HMO number

        // ── Banking ───────────────────────────────────────────────────────────
        'bank_account_number',          // Added — payroll bank account
        'bank_name',                    // Added — bank name

        // ── Contact ───────────────────────────────────────────────────────────
        'personal_email',
        'work_email',
        'company_viber_number',         // Added — company Viber number
        'company_email_outlook',        // Added — Outlook/365 address
        'mobile_number',
        'home_address',

        // ── Emergency contact ─────────────────────────────────────────────────
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_number',

        // ── Leave ─────────────────────────────────────────────────────────────
        'sil_total',
        'sil_used',
        'vl_fund',                      // Added — VL fund accumulation
        'vl_fund_date',                 // Added — VL fund start date

        // ── Uniforms (legacy JSON — new records use uniform_issuances table) ──
        'uniform_records',

        // ── Admin ─────────────────────────────────────────────────────────────
        'data_privacy_consent',
        'data_privacy_consent_date',
        'user_id',
        'remarks',
        'salary_increase_amount',       // Gap #12 — new salary after increase
        'salary_increase_date',         // Gap #12 — effective date of increase
        'created_by',
        'updated_by',

        // ── Agent ─────────────────────────────────────────────────────────────
        'is_agent',     // bool — is this employee a sales agent?
        'agent_code',   // varchar(5) — code stamped on bookings/visa applications
    ];

    protected $casts = [
        'date_of_birth'             => 'date',
        'date_hired'                => 'date',
        'regularization_date'       => 'date',
        'maturity_date'             => 'date',
        'last_evaluation_date'      => 'date',
        'vl_fund_date'              => 'date',
        'data_privacy_consent'      => 'boolean',
        'data_privacy_consent_date' => 'date',
        'uniform_records'           => 'array',
        'vl_fund'                   => 'decimal:2',
        'is_agent'                  => 'boolean',
        'salary_increase_amount'    => 'decimal:2',
        'salary_increase_date'      => 'date',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const EMPLOYMENT_STATUSES = [
        'probationary' => 'Probationary',
        'regular'      => 'Regular',
        'resigned'     => 'Resigned',
        'terminated'   => 'Terminated',
    ];

    public const DEPARTMENTS = [
        'Reservation' => 'Reservation (RESA)',
        'Visa'        => 'Visa & Documentation',
        'Finance'     => 'Finance & Admin',
        'Ormoc'       => 'Ormoc Branch',
        'Marketing'   => 'Marketing',
        'Operations'  => 'Operations',
        'Executive'   => 'Executive',
    ];

    public const GENDERS = ['Male', 'Female', 'Other'];

    public const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated'];

    /**
     * Roles that default to is_agent = true when creating an employee.
     */
    public const AGENT_ROLES = [
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'branch_sales_officer',
        'branch_supervisor',
        'visa_documentation_officer',
    ];

    /**
     * Codes reserved for department/system use — cannot be assigned to a person.
     */
    public const RESERVED_AGENT_CODES = [
        'RESA', 'VISA', 'ORMOC', 'ALL', 'AMKOR', 'ADMIN',
    ];

    // ── Agent helpers ─────────────────────────────────────────────────────────

    /**
     * Returns true if this agent code is stamped on any live transaction.
     * Once true, the agent_code becomes read-only at the application layer.
     */
    public function hasAgentTransactions(): bool
    {
        if (! $this->agent_code) {
            return false;
        }

        $code   = $this->agent_code;
        $tables = ['reservation_bookings', 'visa_applications'];

        foreach ($tables as $table) {
            if (\Illuminate\Support\Facades\Schema::hasTable($table)) {
                if (\Illuminate\Support\Facades\DB::table($table)->where('agent_code', $code)->exists()) {
                    return true;
                }
            }
        }

        return false;
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function uniformIssuances(): HasMany
    {
        return $this->hasMany(UniformIssuance::class, 'employee_id');
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        $name = "{$this->last_name}, {$this->first_name}";
        if ($this->middle_name) {
            $name .= " {$this->middle_name}";
        }
        if ($this->suffix) {
            $name .= " {$this->suffix}";
        }

        return $name;
    }

    public function getDisplayNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getTenureAttribute(): string
    {
        if (! $this->date_hired) {
            return '—';
        }

        if (in_array($this->employment_status, ['resigned', 'terminated'], true)) {
            return 'Inactive';
        }

        $now    = now();
        $hired  = $this->date_hired;
        $years  = $hired->diffInYears($now);
        $months = $hired->copy()->addYears($years)->diffInMonths($now);

        if ($years === 0) {
            return "{$months}mo";
        }

        return $months > 0 ? "{$years}yr {$months}mo" : "{$years}yr";
    }

    public function getSilRemainingAttribute(): int
    {
        return max(0, $this->sil_total - $this->sil_used);
    }

    public function getRegularizationDueAttribute(): bool
    {
        return $this->employment_status === 'probationary'
            && $this->date_hired
            && $this->date_hired->diffInMonths(now()) >= 6;
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('employment_status', ['probationary', 'regular']);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('first_name', 'ilike', "%{$term}%")
                ->orWhere('last_name', 'ilike', "%{$term}%")
                ->orWhere('nickname', 'ilike', "%{$term}%")
                ->orWhere('id_number', 'ilike', "%{$term}%")
                ->orWhere('position', 'ilike', "%{$term}%")
                ->orWhere('employee_code', 'ilike', "%{$term}%")
                ->orWhere('work_email', 'ilike', "%{$term}%");
        });
    }

    public function scopeForBranch(Builder $query, ?int $branchId): Builder
    {
        if (! $branchId) {
            return $query;
        }

        return $query->where('branch_id', $branchId);
    }

    public function scopeForStatus(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }

        return $query->where('employment_status', $status);
    }

    public function scopeForDepartment(Builder $query, ?string $dept): Builder
    {
        if (! $dept) {
            return $query;
        }

        return $query->where('department', $dept);
    }
}
