<?php

namespace Modules\Visa\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Contacts\Models\Contact;

class VisaApplication extends Model
{
    use SoftDeletes;

    protected $table = 'visa_applications';

    protected $fillable = [
        'agent_code',
        'date',
        'agency',
        'contact_id',
        'customer_name',
        'visa_type',
        'selling_price',
        'net_payable',
        'income',
        'status',
        'notes',
        'mode_of_payment',
        'payment_date',
        'soa_number',
        'si_number',
        'ar_number',
        'payment_due_date',
        'payment_request_sent',
        'payment_request_sent_at',
        'or_number',
        'or_received_at',
        'or_endorsed_at',
        'or_endorsed_by',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'payment_date' => 'date',
        'payment_due_date' => 'date',
        'payment_request_sent' => 'boolean',
        'payment_request_sent_at' => 'datetime',
        'or_received_at' => 'datetime',
        'or_endorsed_at' => 'datetime',
        'selling_price' => 'decimal:2',
        'net_payable' => 'decimal:2',
        'income' => 'decimal:2',
    ];

    // ─── Constants ────────────────────────────────────────────────────────────

    public const STATUSES = [
        'pending' => 'Pending',
        'on_process' => 'On Process',
        'completed' => 'Completed',
        'approved' => 'Approved',
        'denied' => 'Denied',
        'forfeited' => 'Forfeited',
        'refunded' => 'Refunded',
    ];

    // Full 45-type list from requirements 4.2
    public const VISA_TYPES = [
        // Visas by country
        'Japan Visa',
        'Korea Visa',
        'Korea E-Visa',
        'Korea Business Visa',
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
        'Turkiye Visa',
        'Turkiye E-Visa',
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
        'Late Pick-Up Fee',
    ];

    public const PAYMENT_MODES = [
        'cash' => 'Cash',
        'bdo' => 'BDO Deposit',
        'bpi' => 'BPI Deposit',
        'metrobank' => 'Metrobank Deposit',
        'card' => 'Credit / Debit Card',
        'check' => 'Check',
    ];

    // Visa agent codes (seeded in Phase 1)
    public const AGENT_CODES = ['ALEX', 'RICCI', 'MEL', 'KAE', 'MIMI', 'MMT'];

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
                ->orWhere('visa_type', 'ilike', "%{$term}%")
                ->orWhere('ar_number', 'ilike', "%{$term}%")
                ->orWhere('si_number', 'ilike', "%{$term}%")
                ->orWhere('agent_code', 'ilike', "%{$term}%");
        });
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
}
