<?php

namespace Modules\Cashbond\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Disbursement\Models\Voucher;

class CashbondReload extends Model
{
    use SoftDeletes;

    protected $table = 'cashbond_reloads';

    protected $fillable = [
        'portal_id',
        'reload_no',
        'amount',
        'request_date',
        'deposit_date',
        'approval_status',
        'checked_by',
        'checked_at',
        'approved_by',
        'approved_at',
        'released_by',
        'released_at',
        'supplier_notified',
        'supplier_notified_at',
        'balance_updated',
        'voucher_id',
        'remarks',
        'audit_remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount'                => 'decimal:2',
        'request_date'          => 'date',
        'deposit_date'          => 'date',
        'checked_at'            => 'datetime',
        'approved_at'           => 'datetime',
        'released_at'           => 'datetime',
        'supplier_notified'     => 'boolean',
        'supplier_notified_at'  => 'datetime',
        'balance_updated'       => 'boolean',
    ];

    // ─── Constants ──────────────────────────────────────────────────────────

    public const APPROVAL_STATUSES = [
        'pending'  => 'Pending',
        'checked'  => 'Checked',
        'approved' => 'Approved',
        'released' => 'Released',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────

    public function portal(): BelongsTo
    {
        return $this->belongsTo(CashbondPortal::class, 'portal_id');
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

    public static function nextNumber(): string
    {
        $year = now()->year;
        $last = static::whereYear('created_at', $year)->max('id') ?? 0;
        return sprintf('CBR-%d-%05d', $year, $last + 1);
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForPortal($query, ?int $portalId)
    {
        if (! $portalId) return $query;
        return $query->where('portal_id', $portalId);
    }

    public function scopeForApprovalStatus($query, ?string $status)
    {
        if (! $status) return $query;
        return $query->where('approval_status', $status);
    }
}
