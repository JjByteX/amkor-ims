<?php

namespace Modules\Disbursement\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Voucher extends Model
{
    use SoftDeletes;

    protected $table = 'vouchers';

    protected $fillable = [
        'type',
        'voucher_no',
        'date',
        'payee',
        'payee_address',
        'check_no',
        'bank_name',
        'check_date',
        'details',
        'account_code',
        'account_description',
        'currency',
        'amount',
        'amount_usd',
        'amount_jpy',
        'approval_status',
        'checked_by',
        'checked_at',
        'approved_by',
        'approved_at',
        'released_by',
        'released_at',
        'pdf_generated',
        'pdf_generated_at',
        'remarks',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'check_date' => 'date',
        'amount' => 'decimal:2',
        'amount_usd' => 'decimal:2',
        'amount_jpy' => 'decimal:2',
        'checked_at' => 'datetime',
        'approved_at' => 'datetime',
        'released_at' => 'datetime',
        'pdf_generated' => 'boolean',
        'pdf_generated_at' => 'datetime',
    ];

    // ─── Constants ─────────────────────────────────────────────────────────

    public const TYPES = [
        'cash' => 'Cash Voucher',
        'check' => 'Check Voucher',
    ];

    public const APPROVAL_STATUSES = [
        'pending' => 'Pending',
        'checked' => 'Checked',
        'approved' => 'Approved',
        'released' => 'Released',
    ];

    public const CURRENCIES = [
        'PHP' => 'PHP',
        'USD' => 'USD',
        'JPY' => 'JPY',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────

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

    public function disbursementEntries(): HasMany
    {
        return $this->hasMany(DisbursementEntry::class);
    }

    // ─── Scopes ────────────────────────────────────────────────────────────

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('voucher_no', 'ilike', "%{$term}%")
                ->orWhere('payee', 'ilike', "%{$term}%")
                ->orWhere('details', 'ilike', "%{$term}%");
        });
    }

    public function scopeForType($query, ?string $type)
    {
        if (! $type) {
            return $query;
        }

        return $query->where('type', $type);
    }

    public function scopeForApprovalStatus($query, ?string $status)
    {
        if (! $status) {
            return $query;
        }

        return $query->where('approval_status', $status);
    }

    public function scopeForBranch($query, ?int $branchId)
    {
        if (! $branchId) {
            return $query;
        }

        return $query->where('branch_id', $branchId);
    }

    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->whereYear('date', $year)->whereMonth('date', $month);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    public function isApproved(): bool
    {
        return in_array($this->approval_status, ['approved', 'released'], true);
    }

    /**
     * Generate next voucher number.
     * CV-2026-00001 for cash, CHV-2026-00001 for check
     */
    public static function nextNumber(string $type): string
    {
        $prefix = $type === 'check' ? 'CHV' : 'CV';
        $year = now()->year;
        $last = static::where('type', $type)
            ->whereYear('created_at', $year)
            ->max('id') ?? 0;

        return sprintf('%s-%d-%05d', $prefix, $year, $last + 1);
    }
}
