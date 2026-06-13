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
        // balance_php and balance_usd are NOT fillable — computed by recalculate() only
        'payment_received_php',
        'payment_received_usd',
        'due_date',
        // days_outstanding is NOT fillable — computed accessor (dropped column)
        // status is NOT freely fillable — see STATUS notes below
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
        'date'                        => 'date',
        'travel_date'                 => 'date',
        'due_date'                    => 'date',
        'collectible_amount_php'      => 'decimal:2',
        'collectible_amount_usd'      => 'decimal:2',
        'payment_received_php'        => 'decimal:2',
        'payment_received_usd'        => 'decimal:2',
        'balance_php'                 => 'decimal:2',
        'balance_usd'                 => 'decimal:2',
        'approved_by_coo_at'          => 'datetime',
        'approved_by_gsm_at'          => 'datetime',
        'endorsed_to_disbursement'    => 'boolean',
        'endorsed_to_disbursement_at' => 'datetime',
        'refund_processed'            => 'boolean',
        'refund_processed_at'         => 'datetime',
        'documents_endorsed'          => 'boolean',
        'documents_endorsed_at'       => 'datetime',
    ];

    // ─── Constants ────────────────────────────────────────────────────────────

    public const DEPARTMENTS = [
        'resa'  => 'RESA (QC)',
        'visa'  => 'Visa & Documentation',
        'ormoc' => 'Ormoc Branch',
    ];

    /**
     * Full status set — matches every distinct Excel tab.
     *
     * Auto-managed (set by recalculate() and the nightly sweep):
     *   pending  — created, not yet actionable (no due_date set)
     *   current  — active, due_date in the future
     *   overdue  — past due_date, balance outstanding
     *   paid     — balance zero
     *
     * Manually-set only (never overridden by recalculate()):
     *   ibayad   — Filipino "to be paid"; active collection queue
     *   blocking — group seat block before booking confirmed
     *   query    — disputed / unclear, flagged for review
     *   cancelled — voided
     */
    public const STATUSES = [
        'pending'   => 'Pending',
        'current'   => 'Current',
        'ibayad'    => 'Ibayad',
        'blocking'  => 'Blocking',
        'overdue'   => 'Overdue',
        'query'     => 'Query',
        'paid'      => 'Paid',
        'cancelled' => 'Cancelled',
    ];

    /** Statuses the system manages automatically — never set these from a form dropdown. */
    public const AUTO_STATUSES = ['pending', 'current', 'overdue', 'paid'];

    /** Statuses only a user can set intentionally — never overridden by recalculate(). */
    public const MANUAL_STATUSES = ['ibayad', 'blocking', 'query', 'cancelled'];

    public const OPEN_STATUSES = ['pending', 'current', 'ibayad', 'blocking', 'overdue', 'query'];

    public const CLOSED_STATUSES = ['paid', 'cancelled'];

    public const APPROVAL_STATUSES = [
        'pending'      => 'Pending',
        'coo_approved' => 'COO Approved',
        'gsm_approved' => 'GSM Approved',
        'approved'     => 'Fully Approved',
        'rejected'     => 'Rejected',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

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

    public function scopeForCorporateAccount($query, ?string $account)
    {
        if (! $account) {
            return $query;
        }

        return $query->where('corporate_account', $account);
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

    /** Due today — not a stored status; derived from due_date. */
    public function scopeDueToday($query)
    {
        return $query->where('due_date', now()->toDateString())
            ->whereNotIn('status', self::CLOSED_STATUSES);
    }

    public function scopeEffectivelyOverdue($query)
    {
        return $query->where('due_date', '<', now()->toDateString())
            ->whereNotIn('status', self::CLOSED_STATUSES);
    }

    // ─── Computed accessors ───────────────────────────────────────────────────

    /**
     * Days outstanding — computed live from due_date. NOT stored in the DB.
     * Replaces the dropped days_outstanding column.
     * Returns 0 when not overdue or when status is closed.
     * For sorting in queries, order by due_date ASC instead.
     */
    public function getDaysOutstandingAttribute(): int
    {
        if (
            ! $this->due_date
            || in_array($this->status, self::CLOSED_STATUSES, true)
            || ! $this->due_date->isPast()
        ) {
            return 0;
        }

        return (int) $this->due_date->diffInDays(now());
    }

    /**
     * Live status — always accurate.
     * Manually-set statuses (ibayad, blocking, query, cancelled) are preserved.
     * Auto-statuses are derived purely from balance and due_date.
     */
    public function getLiveStatusAttribute(): string
    {
        // Fully paid
        if ((float) $this->balance_php <= 0 && (float) $this->balance_usd <= 0) {
            return 'paid';
        }

        // Preserve manual flags
        if (in_array($this->status, self::MANUAL_STATUSES, true)) {
            return $this->status;
        }

        if ($this->due_date && $this->due_date->isPast()) {
            return 'overdue';
        }

        return $this->due_date ? 'current' : 'pending';
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isFullyApproved(): bool
    {
        return $this->approved_by_coo_at && $this->approved_by_gsm_at;
    }

    /**
     * Recompute balances and auto-status. Call after any payment update.
     * NEVER overrides manually-set statuses (MANUAL_STATUSES).
     */
    public function recalculate(): void
    {
        $this->balance_php = max(0, (float) $this->collectible_amount_php - (float) $this->payment_received_php);
        $this->balance_usd = max(0, (float) $this->collectible_amount_usd - (float) $this->payment_received_usd);

        // Only auto-transition statuses that are system-managed
        if (! in_array($this->status, self::MANUAL_STATUSES, true)) {
            $this->status = $this->live_status;
        }
        // days_outstanding is no longer stored — it is a computed accessor
    }
}
