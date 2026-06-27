<?php

namespace Modules\Leave\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\EmployeeRecords\Models\Employee;

class LeaveRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'leave_requests';

    protected $fillable = [
        'employee_id',
        'leave_type',
        'date_from',
        'date_to',
        'days_requested',
        'session',
        'remarks',
        'attachment_path',
        'status',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejection_reason',
        'cancelled_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date_from'      => 'date',
        'date_to'        => 'date',
        'days_requested' => 'decimal:1',
        'approved_at'    => 'datetime',
        'cancelled_at'   => 'datetime',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const LEAVE_TYPES = [
        'sil'              => 'Service Incentive Leave (SIL)',
        'vl'               => 'Vacation Leave (VL)',
        'sl'               => 'Sick Leave',
        'birthday_leave'   => 'Birthday Leave',
        'emergency'        => 'Emergency Leave',
        'official_business'=> 'Official Business',
        'offsetting'       => 'Offsetting',
        'other'            => 'Other',
    ];

    public const STATUSES = [
        'draft'     => 'Draft',
        'pending'   => 'Pending',
        'approved'  => 'Approved',
        'rejected'  => 'Rejected',
        'cancelled' => 'Cancelled',
    ];

    public const SESSIONS = [
        'full_day'    => 'Full Day',
        'first_half'  => 'First Half',
        'second_half' => 'Second Half',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
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
