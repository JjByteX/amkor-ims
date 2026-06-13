<?php

namespace Modules\AccountsPayable\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Contacts\Models\Contact;
use Modules\Disbursement\Models\Voucher;
use Modules\Visa\Models\VisaApplication;

class Payable extends Model
{
    use SoftDeletes;

    protected $table = 'payables';

    protected $fillable = [
        'requisition_no',
        'invoice_date',
        'invoice_no',
        'contact_id',
        'supplier_name',
        'currency',
        'invoice_amount_php',
        'invoice_amount_usd',
        'invoice_amount_jpy',
        'payment_php',
        'payment_usd',
        'payment_jpy',
        'balance_php',
        'balance_usd',
        'balance_jpy',
        'due_date',
        'days_outstanding',
        'payment_date',
        'status',
        'approval_status',
        'checked_by',
        'checked_at',
        'approved_by',
        'approved_at',
        'released_by',
        'released_at',
        'mode_of_payment',
        'account_no',
        'acr',
        'check_no',
        'deposit_slip_attached',
        'deposit_slip_attached_at',
        'voucher_id',
        'visa_application_id',  // Phase 3 — FK to visa_applications
        'remarks',
        'audit_remarks',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date',
        'invoice_amount_php' => 'decimal:2',
        'invoice_amount_usd' => 'decimal:2',
        'invoice_amount_jpy' => 'decimal:2',
        'payment_php' => 'decimal:2',
        'payment_usd' => 'decimal:2',
        'payment_jpy' => 'decimal:2',
        'balance_php' => 'decimal:2',
        'balance_usd' => 'decimal:2',
        'balance_jpy' => 'decimal:2',
        'checked_at' => 'datetime',
        'approved_at' => 'datetime',
        'released_at' => 'datetime',
        'deposit_slip_attached' => 'boolean',
        'deposit_slip_attached_at' => 'datetime',
    ];

    // ─── Constants ─────────────────────────────────────────────────────────

    public const CURRENCIES = [
        'PHP' => 'PHP',
        'USD' => 'USD',
        'JPY' => 'JPY',
    ];

    public const STATUSES = [
        'pending' => 'Pending',
        'overdue' => 'Overdue',
        'paid' => 'Paid',
        'filed' => 'Filed',
    ];

    public const APPROVAL_STATUSES = [
        'pending' => 'Pending',
        'checked' => 'Checked',
        'approved' => 'Approved',
        'released' => 'Released',
    ];

    public const PAYMENT_MODES = [
        'cash' => 'Cash',
        'check' => 'Check',
        'bank_deposit' => 'Bank Deposit',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    /** Phase 3 — back-link to the source visa application (nullable). */
    public function visaApplication(): BelongsTo
    {
        return $this->belongsTo(VisaApplication::class);
    }

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

    // ─── Scopes ────────────────────────────────────────────────────────────

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('supplier_name', 'ilike', "%{$term}%")
                ->orWhere('invoice_no', 'ilike', "%{$term}%")
                ->orWhere('requisition_no', 'ilike', "%{$term}%")
                ->orWhere('acr', 'ilike', "%{$term}%");
        });
    }

    public function scopeForStatus($query, ?string $status)
    {
        if (! $status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    public function scopeForCurrency($query, ?string $currency)
    {
        if (! $currency) {
            return $query;
        }

        return $query->where('currency', $currency);
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
        return $query->whereYear('invoice_date', $year)->whereMonth('invoice_date', $month);
    }

    /**
     * Records where due_date has passed and the balance is not yet cleared.
     * Used by the dashboard and index summary counts so overdue figures are
     * always computed from the actual date rather than the stored status column.
     */
    public function scopeEffectivelyOverdue($query)
    {
        return $query->where('due_date', '<', now()->toDateString())
            ->whereNotIn('status', ['paid', 'filed']);
    }

    /** @deprecated Use scopeEffectivelyOverdue for counts; kept for query compatibility. */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now()->toDateString())
            ->whereNotIn('status', ['paid', 'filed']);
    }

    // ─── Computed helpers ──────────────────────────────────────────────────

    /**
     * Live status derived purely from due_date and balance — never stale.
     * Use this accessor when displaying status in the UI instead of the raw
     * stored `status` column. The stored column is updated on save/recalculate
     * and kept clean by the nightly sweep, but this accessor is always correct.
     */
    public function getLiveStatusAttribute(): string
    {
        if ($this->status === 'filed') {
            return 'filed';
        }

        $allPaid = $this->balance_php <= 0 && $this->balance_usd <= 0 && $this->balance_jpy <= 0;

        if ($allPaid) {
            return 'paid';
        }

        if ($this->due_date && $this->due_date->isPast()) {
            return 'overdue';
        }

        return 'pending';
    }

    /** Recompute balances and status. Call after any payment update. */
    public function recalculate(): void
    {
        $this->balance_php = max(0, (float) $this->invoice_amount_php - (float) $this->payment_php);
        $this->balance_usd = max(0, (float) $this->invoice_amount_usd - (float) $this->payment_usd);
        $this->balance_jpy = max(0, (float) $this->invoice_amount_jpy - (float) $this->payment_jpy);

        // Days outstanding
        if ($this->due_date && $this->due_date->isPast() && $this->status !== 'paid') {
            $this->days_outstanding = (int) $this->due_date->diffInDays(now());
        } else {
            $this->days_outstanding = 0;
        }

        // Auto-status (only if not manually set to filed)
        if ($this->status !== 'filed') {
            $allPaid = $this->balance_php <= 0 && $this->balance_usd <= 0 && $this->balance_jpy <= 0;
            if ($allPaid) {
                $this->status = 'paid';
            } elseif ($this->due_date && $this->due_date->isPast()) {
                $this->status = 'overdue';
            } else {
                $this->status = 'pending';
            }
        }
    }

    public function isFullyPaid(): bool
    {
        return $this->balance_php <= 0 && $this->balance_usd <= 0 && $this->balance_jpy <= 0;
    }

    public function isApproved(): bool
    {
        return in_array($this->approval_status, ['approved', 'released'], true);
    }
}
