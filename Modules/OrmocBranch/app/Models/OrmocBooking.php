<?php

namespace Modules\OrmocBranch\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Contacts\Models\Contact;

class OrmocBooking extends Model
{
    use SoftDeletes;

    protected $table = 'ormoc_bookings';

    protected $fillable = [
        'agent_code',
        'date',
        'client_name',
        'contact_number',
        'email',
        'contact_id',
        'booking_type',
        'destination',
        'travel_date',
        'pax_count',
        'hotel',
        'room_type',
        'flight_details',
        'inclusions',
        'exclusions',
        'remarks',
        'selling_price',
        'net_payable',
        'income',
        'excess',
        'insurance_nett',
        'acr',
        'mode_of_payment',
        'cc_surcharge_applied',
        'date_of_payment',
        'po_number',
        'si_number',
        'or_number',
        'ar_number',
        'soa_number',
        'transaction_type',
        'source',
        'audit_remarks',
        'status',
        'passport_expiry',
        'passport_expiry_flagged',
        'escalated_to_head_office',
        'escalated_at',
        'escalated_by',
        'escalation_acknowledged_at',
        'escalation_acknowledged_by',
        'linked_resa_booking_id',
        'po_sent_to_mariposa',
        'po_sent_to_mariposa_at',
        'forwarded_to_accounting',
        'forwarded_to_accounting_at',
        'notes',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'travel_date' => 'date',
        'date_of_payment' => 'date',
        'passport_expiry' => 'date',
        'escalated_at' => 'datetime',
        'escalation_acknowledged_at' => 'datetime',
        'po_sent_to_mariposa_at' => 'datetime',
        'forwarded_to_accounting_at' => 'datetime',
        'cc_surcharge_applied' => 'boolean',
        'passport_expiry_flagged' => 'boolean',
        'escalated_to_head_office' => 'boolean',
        'po_sent_to_mariposa' => 'boolean',
        'forwarded_to_accounting' => 'boolean',
        'selling_price' => 'decimal:2',
        'net_payable' => 'decimal:2',
        'income' => 'decimal:2',
        'excess' => 'decimal:2',
        'insurance_nett' => 'decimal:2',
        'acr' => 'decimal:2',
    ];

    // ─── Constants ────────────────────────────────────────────────────────────

    public const STATUSES = [
        'inquiry' => 'Inquiry',
        'quoted' => 'Quoted',
        'confirmed' => 'Confirmed',
        'cancelled' => 'Cancelled',
    ];

    public const BOOKING_TYPES = [
        'domestic' => 'Domestic',
        'international' => 'International',
    ];

    public const PAYMENT_MODES = [
        'cash' => 'Cash',
        'bank_transfer' => 'Bank Transfer / Deposit',
        'credit_card' => 'Credit Card (+5%)',
    ];

    // Ormoc agent codes — from project-brief.md
    public const AGENT_CODES = ['AM', 'LB', 'RD', 'KP', 'MMT'];

    // Passport expiry threshold in months
    public const PASSPORT_THRESHOLD_MONTHS = 6;

    // CC surcharge rate
    public const CC_SURCHARGE_RATE = 0.05;

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

    public function escalatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_by');
    }

    public function escalationAcknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalation_acknowledged_by');
    }

    public function linkedResaBooking(): BelongsTo
    {
        return $this->belongsTo(\Modules\Reservation\Models\ReservationBooking::class, 'linked_resa_booking_id');
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
            $q->where('client_name', 'ilike', "%{$term}%")
                ->orWhere('destination', 'ilike', "%{$term}%")
                ->orWhere('po_number', 'ilike', "%{$term}%")
                ->orWhere('ar_number', 'ilike', "%{$term}%")
                ->orWhere('si_number', 'ilike', "%{$term}%")
                ->orWhere('agent_code', 'ilike', "%{$term}%");
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Check if passport expires within 6 months of travel date.
     * Returns true when the flag should be raised.
     */
    public function checkPassportExpiry(): bool
    {
        if (! $this->passport_expiry || ! $this->travel_date) {
            return false;
        }

        $threshold = $this->travel_date->addMonths(self::PASSPORT_THRESHOLD_MONTHS);

        return $this->passport_expiry->lessThan($threshold);
    }

    /**
     * Credit card surcharge amount (5% of selling_price).
     */
    public function ccSurchargeAmount(): float
    {
        return round((float) $this->selling_price * self::CC_SURCHARGE_RATE, 2);
    }

    /**
     * Total amount due when paying by credit card.
     */
    public function totalWithSurcharge(): float
    {
        return round((float) $this->selling_price * (1 + self::CC_SURCHARGE_RATE), 2);
    }
}
