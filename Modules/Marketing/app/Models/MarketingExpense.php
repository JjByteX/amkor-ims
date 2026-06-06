<?php

namespace Modules\Marketing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class MarketingExpense extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'marketing_expenses';

    protected $fillable = [
        'campaign_name', 'category', 'amount', 'currency',
        'expense_date', 'period_month', 'period_year',
        'vendor', 'remarks', 'status', 'material_id',
        'created_by', 'approved_by', 'approved_at', 'updated_by',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'expense_date' => 'date',
        'approved_at'  => 'datetime',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const CATEGORIES = [
        'paid_ads'     => 'Paid Ads',
        'events'       => 'Events',
        'printing'     => 'Printing',
        'production'   => 'Production',
        'email_blast'  => 'Email Blast',
        'photography'  => 'Photography',
        'social_media' => 'Social Media',
        'other'        => 'Other',
    ];

    public const CURRENCIES = ['PHP', 'USD'];

    public const STATUSES = [
        'draft'     => 'Draft',
        'submitted' => 'Submitted',
        'approved'  => 'Approved',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function material(): BelongsTo
    {
        return $this->belongsTo(MarketingMaterial::class, 'material_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'updated_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) return $query;
        return $query->where(function ($q) use ($term) {
            $q->where('campaign_name', 'ilike', "%{$term}%")
              ->orWhere('vendor',      'ilike', "%{$term}%")
              ->orWhere('remarks',     'ilike', "%{$term}%");
        });
    }

    public function scopeForCategory(Builder $query, ?string $cat): Builder
    {
        return $cat ? $query->where('category', $cat) : $query;
    }

    public function scopeForStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('status', $status) : $query;
    }

    public function scopeForPeriod(Builder $query, ?int $month, ?int $year): Builder
    {
        if ($year)  $query->where('period_year', $year);
        if ($month) $query->where('period_month', $month);
        return $query;
    }

    public function scopeForYear(Builder $query, ?int $year): Builder
    {
        return $year ? $query->where('period_year', $year) : $query;
    }
}
