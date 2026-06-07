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
        'material_id', 'platform', 'recorded_date',
        'reach', 'impressions', 'engagements', 'clicks', 'conversions',
        'spend', 'notes', 'created_by',
    ];

    protected $casts = [
        'recorded_date' => 'date',
        'spend' => 'decimal:2',
    ];

    public function material(): BelongsTo
    {
        return $this->belongsTo(MarketingMaterial::class, 'material_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForMaterial(Builder $query, ?int $materialId): Builder
    {
        return $materialId ? $query->where('material_id', $materialId) : $query;
    }
}
