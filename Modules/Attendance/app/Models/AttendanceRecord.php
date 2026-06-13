<?php

namespace Modules\Attendance\Models;

use App\Models\Branch;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        'work_date'   => 'date',
        'time_in_at'  => 'datetime',
        'time_out_at' => 'datetime',
        'hr_override' => 'boolean',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const STANDARD_START = '08:00:00';
    public const STANDARD_END   = '17:00:00';
    public const STANDARD_HOURS = 8;

    /**
     * Status codes — updated to match the Excel timekeeping legend exactly.
     *
     * Excel legend codes:
     *  P     → present
     *  HD    → half_day
     *  U     → undertime       (present but left early; separate from undertime minutes)
     *  L     → late            (present but arrived late; separate from late minutes)
     *  A     → absent
     *  RD    → rest_day
     *  RH    → regular_holiday
     *  SNH   → special_non_working_holiday
     *  P-RH  → present_regular_holiday   (worked on a regular holiday)
     *  P-SH  → present_special_holiday   (worked on a special non-working holiday)
     *  SIL   → on_sil                    (on Service Incentive Leave)
     *  BL    → birthday_leave
     */
    public const STATUSES = [
        'present'                  => 'Present (P)',
        'late'                     => 'Late (L)',
        'undertime'                => 'Undertime (U)',
        'half_day'                 => 'Half Day (HD)',
        'absent'                   => 'Absent (A)',
        'rest_day'                 => 'Rest Day (RD)',
        'regular_holiday'          => 'Regular Holiday (RH)',
        'special_non_working_holiday' => 'Special Non-Working Holiday (SNH)',
        'present_regular_holiday'  => 'Present on Regular Holiday (P-RH)',
        'present_special_holiday'  => 'Present on Special Holiday (P-SH)',
        'on_sil'                   => 'Service Incentive Leave (SIL)',
        'birthday_leave'           => 'Birthday Leave (BL)',
        'on_leave'                 => 'On Leave',        // general leave bucket
    ];

    // Excel code → status key mapping (for import / grid parsing)
    public const EXCEL_CODE_MAP = [
        'P'    => 'present',
        'HD'   => 'half_day',
        'U'    => 'undertime',
        'L'    => 'late',
        'A'    => 'absent',
        'RD'   => 'rest_day',
        'RH'   => 'regular_holiday',
        'SNH'  => 'special_non_working_holiday',
        'P-RH' => 'present_regular_holiday',
        'P-SH' => 'present_special_holiday',
        'SIL'  => 'on_sil',
        'BL'   => 'birthday_leave',
    ];

    public const LEAVE_TYPES = [
        'SIL'              => 'Service Incentive Leave',
        'VL'               => 'Vacation Leave',
        'SL'               => 'Sick Leave',
        'EL'               => 'Emergency Leave',
        'BL'               => 'Birthday Leave',
        'official_business' => 'Official Business',
        'offsetting'       => 'Offsetting',
        'other'            => 'Other',
    ];

    public const STATUS_COLORS = [
        'present'                     => 'success',
        'late'                        => 'warning',
        'undertime'                   => 'warning',
        'half_day'                    => 'warning',
        'absent'                      => 'error',
        'rest_day'                    => 'neutral',
        'regular_holiday'             => 'neutral',
        'special_non_working_holiday' => 'neutral',
        'present_regular_holiday'     => 'success',
        'present_special_holiday'     => 'success',
        'on_sil'                      => 'info',
        'birthday_leave'              => 'info',
        'on_leave'                    => 'info',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getHoursWorkedAttribute(): string
    {
        if (! $this->minutes_worked) {
            return '—';
        }
        $h = intdiv($this->minutes_worked, 60);
        $m = $this->minutes_worked % 60;

        return $m > 0 ? "{$h}h {$m}m" : "{$h}h";
    }

    public function getIsClockedInAttribute(): bool
    {
        return $this->time_in_at !== null && $this->time_out_at === null;
    }

    /**
     * Returns the Excel legend code for this record's status.
     */
    public function getExcelCodeAttribute(): string
    {
        return array_search($this->status, self::EXCEL_CODE_MAP) ?: $this->status;
    }

    // ── Computed helpers ──────────────────────────────────────────────────────

    public static function computeLateMinutes(string $timeIn): int
    {
        $standard = Carbon::today()->setTimeFromTimeString(self::STANDARD_START);
        $actual   = Carbon::today()->setTimeFromTimeString($timeIn);

        return max(0, (int) $standard->diffInMinutes($actual, false));
    }

    public static function computeUndertimeMinutes(string $timeOut): int
    {
        $standard = Carbon::today()->setTimeFromTimeString(self::STANDARD_END);
        $actual   = Carbon::today()->setTimeFromTimeString($timeOut);

        return max(0, (int) $actual->diffInMinutes($standard, false));
    }

    public static function computeMinutesWorked(string $timeIn, string $timeOut): int
    {
        $in  = Carbon::today()->setTimeFromTimeString($timeIn);
        $out = Carbon::today()->setTimeFromTimeString($timeOut);
        if ($out->lessThanOrEqualTo($in)) {
            return 0;
        }

        return (int) $in->diffInMinutes($out);
    }

    /**
     * Resolve an Excel code (e.g. "P-RH") to a status key.
     * Returns null if the code is not recognised.
     */
    public static function resolveExcelCode(string $code): ?string
    {
        return self::EXCEL_CODE_MAP[strtoupper(trim($code))] ?? null;
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
