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
        'booking_no',
        'date',
        'agent_code',
        'client_name',
        'contact_number',
        'email',
        'corporate_account',
        'contact_id',
        'destination',
        'travel_date',
        'return_date',
        'pax_count',
        'service_type',
        'particulars',
        'inclusions',
        'exclusions',
        'selling_price',
        'net_payable',
        'income',
        'mode_of_payment',
        'payment_due_date',
        'soa_number',
        'po_number',
        'si_number',
        'ar_number',
        'or_number',
        'status',
        'forwarded_to_accounting',
        'forwarded_to_accounting_at',
        'forwarded_to_accounting_by',
        'confirmed_at',
        'confirmed_by',
        'remarks',
        'audit_remarks',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'travel_date' => 'date',
        'return_date' => 'date',
        'payment_due_date' => 'date',
        'selling_price' => 'decimal:2',
        'net_payable' => 'decimal:2',
        'income' => 'decimal:2',
        'forwarded_to_accounting' => 'boolean',
        'forwarded_to_accounting_at' => 'datetime',
        'confirmed_at' => 'datetime',
    ];

    public const STATUSES = [
        'inquiry' => 'Inquiry',
        'quoted' => 'Quoted',
        'confirmed' => 'Confirmed',
        'cancelled' => 'Cancelled',
    ];

    public const SERVICE_TYPES = [
        'package' => 'Tour Package',
        'ticketing' => 'Ticketing',
        'hotel' => 'Hotel',
        'transfer' => 'Transfer',
        'insurance' => 'Travel Insurance',
        'other' => 'Other',
    ];

    public const PAYMENT_MODES = [
        'cash' => 'Cash',
        'bank_transfer' => 'Bank Transfer / Deposit',
        'credit_card' => 'Credit Card',
        'check' => 'Check',
        'on_account' => 'On Account',
    ];

    public const AGENT_CODES = ['RT', 'JHONA', 'JRT', 'MMT', 'RESA'];

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
                ->orWhere('agent_code', 'ilike', "%{$term}%")
                ->orWhere('soa_number', 'ilike', "%{$term}%")
                ->orWhere('po_number', 'ilike', "%{$term}%");
        });
    }

    public function recalculateIncome(): void
    {
        $this->income = max(0, (float) $this->selling_price - (float) $this->net_payable);
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
