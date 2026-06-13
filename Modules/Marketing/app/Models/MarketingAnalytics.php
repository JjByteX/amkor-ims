<?php

namespace Modules\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingAnalytics extends Model
{
    use HasFactory;

    protected $table = 'marketing_analytics';

    protected $fillable = [
        'material_id',
        'platform',
        'recorded_date',

        // Engagement metrics
        'reach',
        'impressions',
        'engagements',
        'clicks',
        'conversions',
        'acquisitions',             // Gap #22 — number of acquired customers

        // Spend
        'spend',

        // KPI metrics — Gap #18–21
        'ctr',                      // Click-through rate
        'cpc',                      // Cost per click
        'cpa',                      // Cost per acquisition

        // Revenue & ROI — Gap #23
        'pre_campaign_revenue',
        'post_campaign_revenue',
        'revenue_growth',           // post - pre (stored for fast reporting)
        'campaign_profit',          // post_campaign_revenue - spend
        'roi',                      // campaign_profit / spend

        'notes',
        'created_by',
    ];

    protected $casts = [
        'recorded_date'          => 'date',
        'spend'                  => 'decimal:2',
        'ctr'                    => 'decimal:6',
        'cpc'                    => 'decimal:2',
        'cpa'                    => 'decimal:2',
        'pre_campaign_revenue'   => 'decimal:2',
        'post_campaign_revenue'  => 'decimal:2',
        'revenue_growth'         => 'decimal:2',
        'campaign_profit'        => 'decimal:2',
        'roi'                    => 'decimal:4',
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Recompute derived KPI fields from raw inputs.
     * Call this before saving when spend, clicks, conversions, or revenue change.
     */
    public function recomputeKpis(): void
    {
        $spend = (float) $this->spend;
        $clicks = (int) $this->clicks;
        $acquisitions = (int) $this->acquisitions;
        $impressions = (int) $this->impressions;
        $pre = (float) $this->pre_campaign_revenue;
        $post = (float) $this->post_campaign_revenue;

        $this->ctr = ($impressions > 0)
            ? round($clicks / $impressions, 6)
            : null;

        $this->cpc = ($clicks > 0 && $spend > 0)
            ? round($spend / $clicks, 2)
            : null;

        $this->cpa = ($acquisitions > 0 && $spend > 0)
            ? round($spend / $acquisitions, 2)
            : null;

        $this->revenue_growth = $post - $pre;
        $this->campaign_profit = $post - $spend;

        $this->roi = ($spend > 0)
            ? round($this->campaign_profit / $spend, 4)
            : null;
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

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForMaterial(Builder $query, ?int $materialId): Builder
    {
        return $materialId ? $query->where('material_id', $materialId) : $query;
    }

    public function scopeForPlatform(Builder $query, ?string $platform): Builder
    {
        return $platform ? $query->where('platform', $platform) : $query;
    }

    public function scopeForYear(Builder $query, int $year): Builder
    {
        return $query->whereYear('recorded_date', $year);
    }

    public function scopeForMonth(Builder $query, int $year, int $month): Builder
    {
        return $query->whereYear('recorded_date', $year)
            ->whereMonth('recorded_date', $month);
    }
}
