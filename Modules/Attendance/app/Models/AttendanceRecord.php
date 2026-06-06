<?php

namespace Modules\Attendance\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class AttendanceRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'attendance_records';

    protected $fillable = [
        'employee_id',
        'user_id',
        'work_date',
        'time_in',
        'time_out',
        'time_in_at',
        'time_out_at',
        'minutes_worked',
        'minutes_late',
        'minutes_undertime',
        'status',
        'leave_type',
        'ip_address',
        'device_info',
        'hr_override',
        'override_reason',
        'branch_id',
        'remarks',
        'recorded_by',
        'updated_by',
    ];

    protected $casts = [
        'work_date'    => 'date',
        'time_in_at'   => 'datetime',
        'time_out_at'  => 'datetime',
        'hr_override'  => 'boolean',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const STANDARD_START  = '08:00:00';   // 8:00 AM — base for late calculation
    public const STANDARD_END    = '17:00:00';   // 5:00 PM — base for undertime calculation
    public const STANDARD_HOURS  = 8;            // hours per workday

    public const STATUSES = [
        'present'          => 'Present',
        'absent'           => 'Absent',
        'half_day'         => 'Half Day',
        'on_leave'         => 'On Leave',
        'holiday'          => 'Holiday',
        'rest_day'         => 'Rest Day',
    ];

    public const LEAVE_TYPES = [
        'SIL'               => 'Service Incentive Leave',
        'VL'                => 'Vacation Leave',
        'SL'                => 'Sick Leave',
        'EL'                => 'Emergency Leave',
        'official_business' => 'Official Business',
        'offsetting'        => 'Offsetting',
        'other'             => 'Other',
    ];

    public const STATUS_COLORS = [
        'present'  => 'success',
        'absent'   => 'error',
        'half_day' => 'warning',
        'on_leave' => 'info',
        'holiday'  => 'neutral',
        'rest_day' => 'neutral',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Branch::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'recorded_by');
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    /** Human-readable hours worked string */
    public function getHoursWorkedAttribute(): string
    {
        if (! $this->minutes_worked) {
            return '—';
        }
        $h = intdiv($this->minutes_worked, 60);
        $m = $this->minutes_worked % 60;
        return $m > 0 ? "{$h}h {$m}m" : "{$h}h";
    }

    /** Whether the employee has clocked in but not yet out today */
    public function getIsClockedInAttribute(): bool
    {
        return $this->time_in_at !== null && $this->time_out_at === null;
    }

    // ── Computed helpers ──────────────────────────────────────────────────────

    /**
     * Compute minutes late given a time_in string (H:i:s).
     * Returns 0 if on time or early.
     */
    public static function computeLateMinutes(string $timeIn): int
    {
        $standard = Carbon::today()->setTimeFromTimeString(self::STANDARD_START);
        $actual   = Carbon::today()->setTimeFromTimeString($timeIn);
        return max(0, (int) $standard->diffInMinutes($actual, false));
    }

    /**
     * Compute minutes undertime given a time_out string (H:i:s).
     * Returns 0 if left on time or late.
     */
    public static function computeUndertimeMinutes(string $timeOut): int
    {
        $standard = Carbon::today()->setTimeFromTimeString(self::STANDARD_END);
        $actual   = Carbon::today()->setTimeFromTimeString($timeOut);
        return max(0, (int) $actual->diffInMinutes($standard, false));
    }

    /**
     * Compute total minutes worked between two H:i:s strings.
     */
    public static function computeMinutesWorked(string $timeIn, string $timeOut): int
    {
        $in  = Carbon::today()->setTimeFromTimeString($timeIn);
        $out = Carbon::today()->setTimeFromTimeString($timeOut);
        if ($out->lessThanOrEqualTo($in)) {
            return 0;
        }
        return (int) $in->diffInMinutes($out);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForBranch(Builder $query, ?int $branchId): Builder
    {
        if (! $branchId) {
            return $query;
        }
        return $query->where('branch_id', $branchId);
    }

    public function scopeForMonth(Builder $query, int $year, int $month): Builder
    {
        return $query->whereYear('work_date', $year)->whereMonth('work_date', $month);
    }

    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->where('work_date', $date);
    }

    public function scopeForStatus(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }
        return $query->where('status', $status);
    }

    public function scopeForDateRange(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->where('work_date', '>=', $from);
        }
        if ($to) {
            $query->where('work_date', '<=', $to);
        }
        return $query;
    }
}
