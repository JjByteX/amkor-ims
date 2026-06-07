<?php

namespace Modules\EmployeeRecords\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        'first_name', 'last_name', 'middle_name', 'suffix',
        'date_of_birth', 'gender', 'civil_status',
        'employee_code', 'position', 'department', 'branch_id',
        'employment_status', 'date_hired', 'regularization_date',
        'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number',
        'personal_email', 'work_email', 'mobile_number', 'home_address',
        'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_number',
        'sil_total', 'sil_used',
        'uniform_records',
        'data_privacy_consent', 'data_privacy_consent_date',
        'user_id',
        'remarks',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'date_hired' => 'date',
        'regularization_date' => 'date',
        'data_privacy_consent' => 'boolean',
        'data_privacy_consent_date' => 'date',
        'uniform_records' => 'array',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const EMPLOYMENT_STATUSES = [
        'probationary' => 'Probationary',
        'regular' => 'Regular',
        'resigned' => 'Resigned',
        'terminated' => 'Terminated',
    ];

    public const DEPARTMENTS = [
        'Reservation' => 'Reservation (RESA)',
        'Visa' => 'Visa & Documentation',
        'Finance' => 'Finance & Admin',
        'Ormoc' => 'Ormoc Branch',
        'Marketing' => 'Marketing',
        'Operations' => 'Operations',
        'Executive' => 'Executive',
    ];

    public const GENDERS = ['Male', 'Female', 'Other'];

    public const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated'];

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

    // ── Accessors ─────────────────────────────────────────────────────────────

    /** Full name: Last, First Middle */
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

    /** Display name: First Last */
    public function getDisplayNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /** Tenure in years and months (string) */
    public function getTenureAttribute(): string
    {
        if (! $this->date_hired) {
            return '—';
        }
        $now = now();
        $hired = $this->date_hired;

        if (in_array($this->employment_status, ['resigned', 'terminated'], true)) {
            return 'Inactive';
        }

        $years = $hired->diffInYears($now);
        $months = $hired->copy()->addYears($years)->diffInMonths($now);

        if ($years === 0) {
            return "{$months}mo";
        }

        return $months > 0 ? "{$years}yr {$months}mo" : "{$years}yr";
    }

    /** SIL remaining (computed) */
    public function getSilRemainingAttribute(): int
    {
        return max(0, $this->sil_total - $this->sil_used);
    }

    /** Whether regularization is overdue (probationary > 6 months) */
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
