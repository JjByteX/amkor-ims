<?php

namespace Modules\Overtime\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\EmployeeRecords\Models\Employee;

class OvertimeRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'overtime_requests';

    protected $fillable = [
        'employee_id',
        'work_date',
        'ot_start_time',
        'ot_end_time',
        'minutes_requested',
        'reason',
        'compensation_type',
        'remarks',
        'attachment_path',
        'status',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejection_reason',
        'cancelled_at',
        'request_type',
        'requested_for',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'work_date'   => 'date',
        'approved_at' => 'datetime',
        'cancelled_at'=> 'datetime',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const REASONS = [
        'rush_workload'   => 'Rush Workload',
        'client_deadline' => 'Client Deadline',
        'branch_coverage' => 'Branch Coverage',
        'event_function'  => 'Event / Function',
        'other'           => 'Others',
    ];

    public const COMPENSATION_TYPES = [
        'pay'          => 'Overtime Pay',
        'leave_credit' => 'Extra Leave Credit',
    ];

    public const REQUEST_TYPES = [
        'standard'    => 'Single Day',
        'pre_approved'=> 'Pre-approved',
        'on_behalf'   => 'On Behalf Of',
    ];

    public const STATUSES = [
        'pending'   => 'Pending',
        'approved'  => 'Approved',
        'rejected'  => 'Rejected',
        'cancelled' => 'Cancelled',
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Format minutes as "Xh Ym" (e.g. "2h 30m").
     */
    public function getDurationLabelAttribute(): string
    {
        $h = intdiv($this->minutes_requested, 60);
        $m = $this->minutes_requested % 60;

        if ($h > 0 && $m > 0) {
            return "{$h}h {$m}m";
        }

        return $h > 0 ? "{$h}h" : "{$m}m";
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function requestedFor(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'requested_for');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
