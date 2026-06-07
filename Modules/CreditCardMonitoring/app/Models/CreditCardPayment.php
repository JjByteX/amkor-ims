<?php

namespace Modules\CreditCardMonitoring\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Disbursement\Models\Voucher;

class CreditCardPayment extends Model
{
    use SoftDeletes;

    protected $table = 'credit_card_payments';

    protected $fillable = [
        'credit_card_id',
        'payment_no',
        'amount',
        'due_date',
        'statement_date',
        'payment_date',
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
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'statement_date' => 'date',
        'payment_date' => 'date',
        'checked_at' => 'datetime',
        'approved_at' => 'datetime',
        'released_at' => 'datetime',
    ];

    // ─── Constants ──────────────────────────────────────────────────────────

    public const STATUSES = [
        'pending' => 'Pending',
        'paid' => 'Paid',
        'overdue' => 'Overdue',
    ];

    public const APPROVAL_STATUSES = [
        'pending' => 'Pending',
        'checked' => 'Checked',
        'approved' => 'Approved',
        'released' => 'Released',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────

    public function creditCard(): BelongsTo
    {
        return $this->belongsTo(CreditCard::class, 'credit_card_id');
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
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

        return sprintf('CCP-%d-%05d', $year, $last + 1);
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForCard($query, ?int $cardId)
    {
        if (! $cardId) {
            return $query;
        }

        return $query->where('credit_card_id', $cardId);
    }

    public function scopeForStatus($query, ?string $status)
    {
        if (! $status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->whereYear('due_date', $year)->whereMonth('due_date', $month);
    }
}
