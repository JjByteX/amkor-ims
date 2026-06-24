<?php

namespace Modules\Visa\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\AccountsPayable\Models\Payable;
use Modules\Contacts\Models\Contact;

class VisaApplication extends Model
{
    use SoftDeletes;

    protected $table = 'visa_applications';

    protected $fillable = [
        // ── Core ──────────────────────────────────────────────────────────────
        'agent_code',
        'date',
        'agency',
        'embassy_name',
        'contact_id',
        'customer_name',
        'date_of_birth',
        'visa_type',

        // ── Financials ────────────────────────────────────────────────────────
        'selling_price',
        'net_payable',
        'income',

        // ── Status & notes ────────────────────────────────────────────────────
        'status',
        'notes',

        // ── Client-side payment (SP) — split by bank ─────────────────────────
        'mode_of_payment',
        'payment_date',
        'payment_cash',
        'payment_bdo',
        'payment_bpi',
        'payment_metrobank',
        'payment_card',
        'payment_check',

        // ── Document numbers ─────────────────────────────────────────────────
        'soa_number',
        'si_number',
        'ar_number',

        // ── Embassy payment tracking ──────────────────────────────────────────
        'payment_due_date',
        'payment_request_sent',
        'payment_request_sent_at',

        // ── Payables side (NP paid to embassy) ───────────────────────────────
        'payable_cash',
        'payable_cash_usd',
        'payable_bank_deposit',
        'payable_credit_card',

        // ── OR tracking ───────────────────────────────────────────────────────
        'or_number',
        'cv_number',
        'date_requested',
        'or_received_at',
        'or_endorsed_at',
        'or_endorsed_by',
        'courier_name',
        'date_received',
        // payables_status is NOT fillable — computed accessor from linked Payable
        'date_filed',

        // ── Relations ─────────────────────────────────────────────────────────
        'branch_id',
        'created_by',
        'updated_by',

        // ── Phase 2.3 / 3.4 — attention flag (replaces manual yellow-highlight in Excel) ──
        'needs_attention',
        'attention_reason',
    ];

    protected $casts = [
        'date'                    => 'date',
        'date_of_birth'           => 'date',
        'payment_date'            => 'date',
        'payment_due_date'        => 'date',
        'date_requested'          => 'date',
        'date_received'           => 'date',
        'date_filed'              => 'date',
        'payment_request_sent'    => 'boolean',
        'payment_request_sent_at' => 'datetime',
        'or_received_at'          => 'datetime',
        'or_endorsed_at'          => 'datetime',
        'needs_attention'         => 'boolean',
        'selling_price'           => 'decimal:2',
        'net_payable'             => 'decimal:2',
        'income'                  => 'decimal:2',
        'payment_cash'            => 'decimal:2',
        'payment_bdo'             => 'decimal:2',
        'payment_bpi'             => 'decimal:2',
        'payment_metrobank'       => 'decimal:2',
        'payment_card'            => 'decimal:2',
        'payment_check'           => 'decimal:2',
        'payable_cash'            => 'decimal:2',
        'payable_cash_usd'        => 'decimal:2',
        'payable_bank_deposit'    => 'decimal:2',
        'payable_credit_card'     => 'decimal:2',
    ];

    // ─── Constants ────────────────────────────────────────────────────────────

    public const STATUSES = [
        'pending'    => 'Pending',
        'on_process' => 'On Process',
        'completed'  => 'Completed',
        'approved'   => 'Approved',
        'denied'     => 'Denied',
        'forfeited'  => 'Forfeited',
        'refunded'   => 'Refunded',
    ];

    public const PAYABLES_STATUSES = [
        'pending'  => 'Pending',
        'received' => 'Received',
        'paid'     => 'Paid',
    ];

    /**
     * Visa types — exactly 47 types matching the client's Excel income monitoring list.
     * Fixed: Türkiye now uses the correct umlaut (ü) to match Excel display.
     */
    public const VISA_TYPES = [
        // Country visas
        'Japan Visa',
        'Korea Visa',
        'Korea E-Visa',
        'Korea Business Visa',
        'Korea Assistance',
        'Australia Visa',
        'US Visa',
        'China Visa',
        'France Visa',
        'Italy Visa',
        'Italy Visa Assistance',
        'Germany Visa',
        'Greece Visa',
        'Ireland Visa',
        'Spain Visa',
        'Sweden Visa',
        'Switzerland Visa',
        'Netherlands Visa',
        'New Zealand Visa',
        'Norway Visa',
        'Portugal Visa',
        'UK Visa',
        'Dubai Visa',
        'India Visa',
        'India E-Visa',
        'ETA Canada Visa',
        'Canada Visa',
        'Japan Commercial Visa',
        'Japan Student Visa',
        'Türkiye Visa',
        'Türkiye E-Visa',
        '13A Visa',
        // Services
        'Cash Bond',
        'Passporting',
        'Courier',
        'Dropbox',
        'Travel Insurance',
        'Booking Certification',
        'Form Filling',
        'Photocopy',
        'Picture Printing',
        'Premium Appointment',
        'PSA BC',
        'PSA MC',
        'Apostille',
        'Notary',
        'Late Pick-Up Fee',
    ];

    public const PAYMENT_MODES = [
        'cash'      => 'Cash',
        'bdo'       => 'BDO Deposit',
        'bpi'       => 'BPI Deposit',
        'metrobank' => 'Metrobank Deposit',
        'card'      => 'Credit / Debit Card',
        'check'     => 'Check',
        'mixed'     => 'Mixed / Split',
    ];

    public const AGENT_CODES = ['ALEX', 'RICCI', 'MEL', 'KAE', 'MIMI', 'MMT'];

    /**
     * Always include computed accessors in array/JSON output (Inertia props).
     * Without this, `payables_status` was silently dropped from every
     * response that serializes the model directly.
     */
    protected $appends = [
        'payables_status',
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

    public function orEndorsedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'or_endorsed_by');
    }

    /**
     * The linked AP Payable for this visa application (created automatically
     * by CreatePayableFromVisaPaymentRequest when payment is requested).
     */
    public function payable(): HasOne
    {
        return $this->hasOne(Payable::class, 'visa_application_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForAgent($query, ?string $code)
    {
        if (! $code) {
            return $query;
        }

        return $query->where('agent_code', $code);
    }

    public function scopeForBranch($query, ?int $branchId)
    {
        if (! $branchId) {
            return $query;
        }

        return $query->where('branch_id', $branchId);
    }

    public function scopeForYear($query, int $year)
    {
        return $query->whereYear('date', $year);
    }

    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->whereYear('date', $year)->whereMonth('date', $month);
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('customer_name', 'ilike', "%{$term}%")
                ->orWhere('agency', 'ilike', "%{$term}%")
                ->orWhere('embassy_name', 'ilike', "%{$term}%")
                ->orWhere('visa_type', 'ilike', "%{$term}%")
                ->orWhere('ar_number', 'ilike', "%{$term}%")
                ->orWhere('si_number', 'ilike', "%{$term}%")
                ->orWhere('cv_number', 'ilike', "%{$term}%")
                ->orWhere('agent_code', 'ilike', "%{$term}%");
        });
    }

    // ─── Computed accessors ───────────────────────────────────────────────────

    /**
     * payables_status — computed live from the linked Payable record.
     * NOT stored in the DB (dropped column). Replaces the stored column that
     * went stale whenever the Payable was updated without a sync listener.
     * Returns 'pending' when no linked Payable exists yet.
     */
    public function getPayablesStatusAttribute(): string
    {
        return $this->payable?->status ?? 'pending';
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function hasOrPending(): bool
    {
        return $this->payment_request_sent && ! $this->or_number;
    }

    public function isEndorsed(): bool
    {
        return ! is_null($this->or_endorsed_at);
    }

    public function totalPaymentCollected(): float
    {
        return (float) ($this->payment_cash ?? 0)
            + (float) ($this->payment_bdo ?? 0)
            + (float) ($this->payment_bpi ?? 0)
            + (float) ($this->payment_metrobank ?? 0)
            + (float) ($this->payment_card ?? 0)
            + (float) ($this->payment_check ?? 0);
    }

    public function totalPayableDispatched(): float
    {
        return (float) ($this->payable_cash ?? 0)
            + (float) ($this->payable_bank_deposit ?? 0)
            + (float) ($this->payable_credit_card ?? 0);
    }
}