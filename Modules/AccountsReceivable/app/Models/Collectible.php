<?php

namespace Modules\AccountsReceivable\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Contacts\Models\Contact;

class Collectible extends Model
{
    use SoftDeletes;

    protected $table = 'collectibles';

    protected $fillable = [
        'source_type',
        'source_id',
        'department',
        'agent_code',
        'date',
        'contact_id',
        'customer_name',
        'corporate_account',
        'particulars',
        'travel_date',
        'terms',
        'collectible_amount_php',
        'collectible_amount_usd',
        'payment_received_php',
        'payment_received_usd',
        'balance_php',
        'balance_usd',
        'due_date',
        'days_outstanding',
        'status',
        'approval_status',
        'approved_by_coo',
        'approved_by_coo_at',
        'approved_by_gsm',
        'approved_by_gsm_at',
        'endorsed_to_disbursement',
        'endorsed_to_disbursement_at',
        'refund_processed',
        'refund_processed_at',
        'documents_endorsed',
        'documents_endorsed_at',
        'or_number',
        'ar_number',
        'si_number',
        'remarks',
        'audit_remarks',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'travel_date' => 'date',
        'due_date' => 'date',
        'collectible_amount_php' => 'decimal:2',
        'collectible_amount_usd' => 'decimal:2',
        'payment_received_php' => 'decimal:2',
        'payment_received_usd' => 'decimal:2',
        'balance_php' => 'decimal:2',
        'balance_usd' => 'decimal:2',
        'approved_by_coo_at' => 'datetime',
        'approved_by_gsm_at' => 'datetime',
        'endorsed_to_disbursement' => 'boolean',
        'endorsed_to_disbursement_at' => 'datetime',
        'refund_processed' => 'boolean',
        'refund_processed_at' => 'datetime',
        'documents_endorsed' => 'boolean',
        'documents_endorsed_at' => 'datetime',
    ];

    // ─── Constants ────────────────────────────────────────────────────────────

    public const DEPARTMENTS = [
        'resa' => 'RESA (QC)',
        'visa' => 'Visa & Documentation',
        'ormoc' => 'Ormoc Branch',
    ];

    public const STATUSES = [
        'current' => 'Current',
        'overdue' => 'Overdue',
        'paid' => 'Paid',
    ];

    public const APPROVAL_STATUSES = [
        'pending' => 'Pending',
        'coo_approved' => 'COO Approved',
        'gsm_approved' => 'GSM Approved',
        'approved' => 'Fully Approved',
        'rejected' => 'Rejected',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Contact relationship — uses the Contacts module model.
     * Direct model reference is acceptable here because Collectible stores
     * a FK to contacts.id and needs to resolve the contact for display and
     * document generation. No write operations cross the module boundary.
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function cooApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_coo');
    }

    public function gsmApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_gsm');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForBranch($query, ?int $branchId)
    {
        if (! $branchId) {
            return $query;
        }

        return $query->where('branch_id', $branchId);
    }

    public function scopeForDepartment($query, ?string $dept)
    {
        if (! $dept) {
            return $query;
        }

        return $query->where('department', $dept);
    }

    public function scopeForAgent($query, ?string $code)
    {
        if (! $code) {
            return $query;
        }

        return $query->where('agent_code', $code);
    }

    public function scopeForStatus($query, ?string $status)
    {
        if (! $status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('customer_name', 'ilike', "%{$term}%")
                ->orWhere('corporate_account', 'ilike', "%{$term}%")
                ->orWhere('particulars', 'ilike', "%{$term}%")
                ->orWhere('or_number', 'ilike', "%{$term}%")
                ->orWhere('ar_number', 'ilike', "%{$term}%")
                ->orWhere('agent_code', 'ilike', "%{$term}%");
        });
    }

    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->whereYear('date', $year)->whereMonth('date', $month);
    }

    /**
     * Records where due_date has passed and the balance is not yet cleared.
     * Used by the dashboard and index summary counts so overdue figures are
     * always computed from the actual date rather than the stored status column.
     */
    public function scopeEffectivelyOverdue($query)
    {
        return $query->where('due_date', '<', now()->toDateString())
            ->whereNotIn('status', ['paid', 'refunded']);
    }

    /** @deprecated Use scopeEffectivelyOverdue for counts; kept for query compatibility. */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now()->toDateString())
            ->where('status', '!=', 'paid');
    }

    // ─── Computed helpers ─────────────────────────────────────────────────────

    /** Both COO and GSM have approved. */
    public function isFullyApproved(): bool
    {
        return $this->approved_by_coo_at && $this->approved_by_gsm_at;
    }

    /**
     * Live status derived purely from due_date and balance — never stale.
     * Use this accessor when displaying status in the UI instead of the raw
     * stored `status` column. The stored column is updated on save/recalculate
     * and kept clean by the nightly sweep, but this accessor is always correct.
     */
    public function getLiveStatusAttribute(): string
    {
        if ($this->balance_php <= 0 && $this->balance_usd <= 0) {
            return 'paid';
        }

        if ($this->due_date && $this->due_date->isPast()) {
            return 'overdue';
        }

        return 'current';
    }

    /** Recompute and store balances + overdue flag. Call after any payment update. */
    public function recalculate(): void
    {
        $this->balance_php = max(0, $this->collectible_amount_php - $this->payment_received_php);
        $this->balance_usd = max(0, $this->collectible_amount_usd - $this->payment_received_usd);

        // days_outstanding from due_date to today (0 if not overdue)
        if ($this->due_date && $this->due_date->isPast() && $this->status !== 'paid') {
            $this->days_outstanding = (int) $this->due_date->diffInDays(now());
        } else {
            $this->days_outstanding = 0;
        }

        // Auto-set status
        if ($this->balance_php <= 0 && $this->balance_usd <= 0) {
            $this->status = 'paid';
        } elseif ($this->due_date && $this->due_date->isPast()) {
            $this->status = 'overdue';
        } else {
            $this->status = 'current';
        }
    }
}
