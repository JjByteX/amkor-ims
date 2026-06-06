<?php

namespace Modules\BillsMonitoring\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Disbursement\Models\Voucher;

class Bill extends Model
{
    use SoftDeletes;

    protected $table = 'bills';

    protected $fillable = [
        'bill_type',
        'name',
        'account_no',
        'provider',
        'amount',
        'due_date',
        'payment_date',
        'mode_of_payment',
        'status',
        'approval_status',
        'checked_by',
        'checked_at',
        'approved_by',
        'approved_at',
        'released_by',
        'released_at',
        'voucher_id',
        'remarks',
        'audit_remarks',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'due_date'     => 'date',
        'payment_date' => 'date',
        'checked_at'   => 'datetime',
        'approved_at'  => 'datetime',
        'released_at'  => 'datetime',
    ];

    // ─── Constants ──────────────────────────────────────────────────────────

    public const BILL_TYPES = [
        'utility'    => 'Utility',
        'membership' => 'Membership / Renewal',
        'permit'     => 'Permit',
        'premium'    => 'Premium Payment',
        'supplies'   => 'Office Supplies',
        'other'      => 'Other',
    ];

    public const PAYMENT_MODES = [
        'credit_card'  => 'Credit Card',
        'bank_deposit' => 'Bank Deposit',
        'cash'         => 'Cash',
    ];

    public const STATUSES = [
        'pending' => 'Pending',
        'paid'    => 'Paid',
        'overdue' => 'Overdue',
    ];

    public const APPROVAL_STATUSES = [
        'pending'  => 'Pending',
        'checked'  => 'Checked',
        'approved' => 'Approved',
        'released' => 'Released',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function checker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function releaser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    public function isApproved(): bool
    {
        return in_array($this->approval_status, ['approved', 'released'], true);
    }

    public function isOverdue(): bool
    {
        return $this->status !== 'paid' && $this->due_date && now()->greaterThan($this->due_date);
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) return $query;
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
              ->orWhere('provider', 'ilike', "%{$term}%")
              ->orWhere('account_no', 'ilike', "%{$term}%");
        });
    }

    public function scopeForType($query, ?string $type)
    {
        if (! $type) return $query;
        return $query->where('bill_type', $type);
    }

    public function scopeForStatus($query, ?string $status)
    {
        if (! $status) return $query;
        return $query->where('status', $status);
    }

    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->whereYear('due_date', $year)->whereMonth('due_date', $month);
    }

    public function scopeForBranch($query, ?int $branchId)
    {
        if (! $branchId) return $query;
        return $query->where('branch_id', $branchId);
    }
}
