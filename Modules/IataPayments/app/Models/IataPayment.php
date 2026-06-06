<?php

namespace Modules\IataPayments\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Contacts\Models\Contact;
use Modules\Disbursement\Models\Voucher;

class IataPayment extends Model
{
    use SoftDeletes;

    protected $table = 'iata_payments';

    protected $fillable = [
        'payment_no',
        'contact_id',
        'operator_name',
        'billing_reference',
        'billing_date',
        'due_date',
        'amount',
        'payment_date',
        'status',
        'approval_status',
        'checked_by',
        'checked_at',
        'approved_by',
        'approved_at',
        'released_by',
        'released_at',
        'deposit_slip_attached',
        'deposit_slip_attached_at',
        'operator_notified',
        'operator_notified_at',
        'voucher_id',
        'remarks',
        'audit_remarks',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount'                    => 'decimal:2',
        'billing_date'              => 'date',
        'due_date'                  => 'date',
        'payment_date'              => 'date',
        'checked_at'                => 'datetime',
        'approved_at'               => 'datetime',
        'released_at'               => 'datetime',
        'deposit_slip_attached'     => 'boolean',
        'deposit_slip_attached_at'  => 'datetime',
        'operator_notified'         => 'boolean',
        'operator_notified_at'      => 'datetime',
    ];

    // ─── Constants ──────────────────────────────────────────────────────────

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

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

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

    public static function nextNumber(): string
    {
        $year = now()->year;
        $last = static::whereYear('created_at', $year)->max('id') ?? 0;
        return sprintf('IATA-%d-%05d', $year, $last + 1);
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) return $query;
        return $query->where(function ($q) use ($term) {
            $q->where('operator_name', 'ilike', "%{$term}%")
              ->orWhere('payment_no', 'ilike', "%{$term}%")
              ->orWhere('billing_reference', 'ilike', "%{$term}%");
        });
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
}
