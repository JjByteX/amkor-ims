<?php

namespace Modules\Reservation\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Contacts\Models\Contact;

class ReservationBooking extends Model
{
    use SoftDeletes;

    protected $table = 'reservation_bookings';

    protected $fillable = [
        // Core
        'booking_no',
        'date',
        'agent_code',
        'branch_id',

        // Client
        'client_name',
        'contact_person',   // Phase 2.1 — free-text contact name (corporate travel coordinator)
        'date_of_birth',
        'contact_number',
        'email',
        'corporate_account',
        'contact_id',

        // Trip
        'destination',
        'airline',
        'travel_date',
        'return_date',
        'pax_count',
        'service_type',
        'transaction_type',
        'source',
        'particulars',
        'inclusions',
        'exclusions',

        // Ormoc-specific trip fields (nullable for QC bookings)
        'booking_type',
        'hotel',
        'room_type',
        'flight_details',

        // Passport (Ormoc)
        'passport_expiry',
        'passport_expiry_flagged',

        // Financials
        'selling_price',
        'net_payable',
        'income',
        'excess',
        'insurance_nett',
        'acr',

        // Payment
        'mode_of_payment',
        'payment_due_date',
        'cc_surcharge_applied',  // Ormoc only — 5% on credit card
        'surcharge_amount',      // Phase 2.2 — calculated surcharge (selling_price × 0.05)
        'date_of_payment',       // Ormoc: actual payment received date

        // Document references
        'soa_number',
        'po_number',
        'si_number',
        'ar_number',
        'or_number',

        // Status & workflow
        'status',
        'forwarded_to_accounting',
        'forwarded_to_accounting_at',
        'forwarded_to_accounting_by',
        'confirmed_at',
        'confirmed_by',

        // Notes & audit
        'remarks',
        'audit_remarks',
        'notes',                 // Ormoc freeform notes (separate from remarks)

        // Escalation (Ormoc → QC, for international bookings)
        'escalated_to_head_office',
        'escalated_at',
        'escalated_by',
        'escalation_acknowledged_at',
        'escalation_acknowledged_by',
        'linked_resa_booking_id',

        // Mariposa PO — legacy columns, kept until frontend migrates to operator fields
        'po_sent_to_mariposa',
        'po_sent_to_mariposa_at',

        // Phase 2.5 — generalised operator PO (FK to contacts)
        'po_sent_to_operator_id',
        'po_sent_to_operator_at',

        // Audit
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date'                          => 'date',
        'date_of_birth'                 => 'date',
        'travel_date'                   => 'date',
        'return_date'                   => 'date',
        'payment_due_date'              => 'date',
        'date_of_payment'               => 'date',
        'passport_expiry'               => 'date',
        'escalated_at'                  => 'datetime',
        'escalation_acknowledged_at'    => 'datetime',
        'po_sent_to_mariposa_at'        => 'datetime',
        'selling_price'                 => 'decimal:2',
        'net_payable'                   => 'decimal:2',
        'income'                        => 'decimal:2',
        'excess'                        => 'decimal:2',
        'insurance_nett'                => 'decimal:2',
        'forwarded_to_accounting'       => 'boolean',
        'forwarded_to_accounting_at'    => 'datetime',
        'confirmed_at'                  => 'datetime',
        'passport_expiry_flagged'       => 'boolean',
        'cc_surcharge_applied'          => 'boolean',
        'surcharge_amount'              => 'decimal:2',
        'escalated_to_head_office'      => 'boolean',
        'po_sent_to_mariposa'           => 'boolean',
        'po_sent_to_operator_at'        => 'datetime',
    ];

    // ─── Constants ────────────────────────────────────────────────────────────

    public const STATUSES = [
        'inquiry'   => 'Inquiry',
        'quoted'    => 'Quoted',
        'confirmed' => 'Confirmed',
        'cancelled' => 'Cancelled',
    ];

    public const SERVICE_TYPES = [
        'package'   => 'Tour Package',
        'ticketing' => 'Ticketing',
        'hotel'     => 'Hotel',
        'transfer'  => 'Transfer',
        'insurance' => 'Travel Insurance',
        'other'     => 'Other',
    ];

    public const TRANSACTION_TYPES = [
        'fit'       => 'FIT',
        'corporate' => 'Corporate',
        'group'     => 'Group',
        'blocking'  => 'Blocking',
    ];

    public const BOOKING_TYPES = [
        'domestic'      => 'Domestic',
        'international' => 'International',
    ];

    public const PAYMENT_MODES = [
        'cash'          => 'Cash',
        'bank_transfer' => 'Bank Transfer / Deposit',
        'credit_card'   => 'Credit Card',
        'check'         => 'Check',
        'on_account'    => 'On Account',
    ];

    // QC agent codes
    public const QC_AGENT_CODES = ['RT', 'RP', 'EJ', 'KG', 'CM', 'JR', 'EB', 'JF', 'MMT', 'AL', 'KL', 'JMMT'];

    // Ormoc agent codes
    public const ORMOC_AGENT_CODES = ['AM', 'LB', 'RD', 'KP', 'MMT'];

    // All agent codes (for all-access roles)
    public const AGENT_CODES = ['RT', 'RP', 'EJ', 'KG', 'CM', 'JR', 'EB', 'JF', 'MMT', 'AL', 'KL', 'JMMT', 'AM', 'LB', 'RD', 'KP'];

    // CC surcharge rate (Ormoc only)
    public const CC_SURCHARGE_RATE = 0.05;

    // Passport expiry threshold in months
    public const PASSPORT_THRESHOLD_MONTHS = 6;

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

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function accountingForwarder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'forwarded_to_accounting_by');
    }

    public function escalatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_by');
    }

    public function escalationAcknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalation_acknowledged_by');
    }

    /** The RESA booking that QC created to fulfil this Ormoc escalation */
    public function linkedResaBooking(): BelongsTo
    {
        return $this->belongsTo(ReservationBooking::class, 'linked_resa_booking_id');
    }

    /** Phase 2.5 — the operator (Contact) this PO was sent to */
    public function poOperator(): BelongsTo
    {
        return $this->belongsTo(\Modules\Contacts\Models\Contact::class, 'po_sent_to_operator_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForBranch($query, ?int $branchId)
    {
        if (! $branchId) {
            return $query;
        }

        return $query->where('branch_id', $branchId);
    }

    public function scopeForStatus($query, ?string $status)
    {
        if (! $status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    public function scopeForAgent($query, ?string $agentCode)
    {
        if (! $agentCode) {
            return $query;
        }

        return $query->where('agent_code', $agentCode);
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('booking_no', 'ilike', "%{$term}%")
                ->orWhere('client_name', 'ilike', "%{$term}%")
                ->orWhere('corporate_account', 'ilike', "%{$term}%")
                ->orWhere('destination', 'ilike', "%{$term}%")
                ->orWhere('airline', 'ilike', "%{$term}%")
                ->orWhere('agent_code', 'ilike', "%{$term}%")
                ->orWhere('soa_number', 'ilike', "%{$term}%")
                ->orWhere('po_number', 'ilike', "%{$term}%");
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function recalculateIncome(): void
    {
        $this->income = max(0, (float) $this->selling_price - (float) $this->net_payable);
    }

    public function recalculateExcess(): void
    {
        $this->excess = (float) $this->selling_price
            - (float) $this->net_payable
            - (float) $this->income;
    }

    /** Check if passport expires within 6 months of travel date. */
    public function checkPassportExpiry(): bool
    {
        if (! $this->passport_expiry || ! $this->travel_date) {
            return false;
        }

        $threshold = $this->travel_date->copy()->addMonths(self::PASSPORT_THRESHOLD_MONTHS);

        return $this->passport_expiry->lt($threshold);
    }

    /** CC surcharge amount (5% of selling_price). Ormoc only. */
    public function ccSurchargeAmount(): float
    {
        return round((float) $this->selling_price * self::CC_SURCHARGE_RATE, 2);
    }

    /**
     * Phase 2.2 — Apply (or clear) the CC surcharge flag and amount.
     *
     * Call this in the controller whenever mode_of_payment or selling_price
     * changes for an Ormoc booking.  Pass $isOrmoc = true only when the
     * booking belongs to the Ormoc branch.
     *
     *   $booking->applyCcSurcharge($booking->mode_of_payment === 'credit_card', $isOrmoc);
     */
    public function applyCcSurcharge(bool $apply, bool $isOrmoc): void
    {
        if ($apply && $isOrmoc) {
            $this->cc_surcharge_applied = true;
            $this->surcharge_amount     = $this->ccSurchargeAmount();
        } else {
            $this->cc_surcharge_applied = false;
            $this->surcharge_amount     = null;
        }
    }

    /**
     * Returns the agent codes appropriate for a given branch code.
     * All-access roles should pass null to get the full combined list.
     */
    public static function agentCodesForBranch(?string $branchCode): array
    {
        return match ($branchCode) {
            'ORMOC'   => self::ORMOC_AGENT_CODES,
            'QC_MAIN' => self::QC_AGENT_CODES,
            default   => self::AGENT_CODES,
        };
    }

    public static function nextNumber(): string
    {
        $prefix = 'RESA-'.now()->format('Ym').'-';
        $latest = static::where('booking_no', 'like', $prefix.'%')
            ->orderByDesc('booking_no')
            ->value('booking_no');

        $next = $latest ? ((int) substr($latest, -4)) + 1 : 1;

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
