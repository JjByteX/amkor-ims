<?php

namespace Modules\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MarketingExpense extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'marketing_expenses';

    protected $fillable = [
        'campaign_name',
        'voucher_number',
        'invoice_number',
        'category',
        'platform',
        'amount',
        'budget',
        'currency',
        'expense_date',
        'period_month',
        'period_year',
        'vendor',
        'payee',
        'remarks',
        'status',
        'material_id',
        'created_by',
        'approved_by',
        'approved_at',
        'updated_by',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'budget'       => 'decimal:2',
        'expense_date' => 'date',
        'approved_at'  => 'datetime',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    /**
     * Categories — aligned exactly to the Excel Marketing Expense breakdown.
     *
     * MET (Marketing Expense Type) sub-categories are now split into three
     * distinct keys to match the Excel: Materials | Equipment | Tools & Technology.
     * The old single `met` key is kept as an alias for legacy records.
     */
    public const CATEGORIES = [
        'paid_ads'      => 'Paid Ads (Advertising)',
        'met_materials' => 'MET — Materials',
        'met_equipment' => 'MET — Equipment',
        'met_tools'     => 'MET — Tools & Technology',
        'met'           => 'MET Expenses (Legacy)',   // keep for existing rows
        'printing'      => 'Printing',
        'design'        => 'Design Cost',
        'promotion'     => 'Promotion',
        'shipping'      => 'Shipping Cost',
        'events'        => 'Events & Tradeshow',
        'sales_call'    => 'Sales Call',
        'representation' => 'Representation',
        'transpo'       => 'Transpo & Travel',
        'certification' => 'Certification',
        'other'         => 'Other',
    ];

    /**
     * MET sub-category keys — used to group all MET rows in reports.
     */
    public const MET_CATEGORIES = ['met_materials', 'met_equipment', 'met_tools', 'met'];

    /**
     * Platforms for the Ads tab — column headers from the Excel exactly.
     * Used as sub-category when category = 'paid_ads'.
     */
    public const PLATFORMS = [
        'facebook'      => 'Facebook',
        'instagram'     => 'Instagram',
        'google_ads'    => 'Google Ads',
        'meta_verified' => 'Meta Verified',
        'tiktok'        => 'TikTok',
        'microsoft'     => 'Microsoft',
    ];

    public const CURRENCIES = ['PHP', 'USD'];

    public const STATUSES = [
        'draft'     => 'Draft',
        'submitted' => 'Submitted',
        'approved'  => 'Approved',
    ];

    // ── Computed ──────────────────────────────────────────────────────────────

    /**
     * Budget vs Spend variance. Negative = over budget.
     */
    public function getBudgetVarianceAttribute(): ?float
    {
        if (is_null($this->budget)) {
            return null;
        }

        return (float) $this->budget - (float) $this->amount;
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function material(): BelongsTo
    {
        return $this->belongsTo(MarketingMaterial::class, 'material_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('campaign_name', 'ilike', "%{$term}%")
                ->orWhere('vendor', 'ilike', "%{$term}%")
                ->orWhere('payee', 'ilike', "%{$term}%")
                ->orWhere('invoice_number', 'ilike', "%{$term}%")
                ->orWhere('voucher_number', 'ilike', "%{$term}%")
                ->orWhere('remarks', 'ilike', "%{$term}%");
        });
    }

    public function scopeForCategory(Builder $query, ?string $cat): Builder
    {
        return $cat ? $query->where('category', $cat) : $query;
    }

    /**
     * Scope for all MET rows regardless of sub-category.
     */
    public function scopeForMet(Builder $query): Builder
    {
        return $query->whereIn('category', self::MET_CATEGORIES);
    }

    public function scopeForPlatform(Builder $query, ?string $platform): Builder
    {
        return $platform ? $query->where('platform', $platform) : $query;
    }

    public function scopeForStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('status', $status) : $query;
    }

    public function scopeForPeriod(Builder $query, ?int $month, ?int $year): Builder
    {
        if ($year) {
            $query->where('period_year', $year);
        }
        if ($month) {
            $query->where('period_month', $month);
        }

        return $query;
    }

    public function scopeForYear(Builder $query, ?int $year): Builder
    {
        return $year ? $query->where('period_year', $year) : $query;
    }

    /**
     * Ads tab scope — paid ads only, typically filtered further by platform.
     */
    public function scopeAds(Builder $query): Builder
    {
        return $query->where('category', 'paid_ads');
    }
}
