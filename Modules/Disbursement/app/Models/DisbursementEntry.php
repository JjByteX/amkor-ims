<?php

namespace Modules\Disbursement\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DisbursementEntry extends Model
{
    use SoftDeletes;

    protected $table = 'disbursement_entries';

    protected $fillable = [
        'date',
        'category',
        'reference_no',
        'voucher_id',
        'payee',
        'description',
        'account_code',
        'currency',
        'amount',
        'fund_type',
        'remarks',
        'access_file_period',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date'               => 'date',
        'amount'             => 'decimal:2',
        'access_file_period' => 'date',
    ];

    // ─── Constants ─────────────────────────────────────────────────────────

    public const CATEGORIES = [
        'cash'            => 'Cash',
        'check'           => 'Check',
        'liaison_admin'   => 'Liaison Travel (Admin)',
        'liaison_banks'   => 'Liaison Travel (Banks)',
    ];

    public const FUND_TYPES = [
        'cash_on_hand' => 'Cash on Hand',
        'cash_on_bank' => 'Cash on Bank',
        'petty_cash'   => 'Petty Cash',
    ];

    public const CURRENCIES = [
        'PHP' => 'PHP',
        'USD' => 'USD',
        'JPY' => 'JPY',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
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

    // ─── Scopes ────────────────────────────────────────────────────────────

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) return $query;
        return $query->where(function ($q) use ($term) {
            $q->where('payee',        'ilike', "%{$term}%")
              ->orWhere('description', 'ilike', "%{$term}%")
              ->orWhere('reference_no','ilike', "%{$term}%");
        });
    }

    public function scopeForCategory($query, ?string $cat)
    {
        if (! $cat) return $query;
        return $query->where('category', $cat);
    }

    public function scopeForBranch($query, ?int $branchId)
    {
        if (! $branchId) return $query;
        return $query->where('branch_id', $branchId);
    }

    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->whereYear('date', $year)->whereMonth('date', $month);
    }

    public function scopeForAccessPeriod($query, ?string $period)
    {
        if (! $period) return $query;
        return $query->where('access_file_period', $period);
    }
}