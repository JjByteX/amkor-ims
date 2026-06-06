<?php

namespace Modules\Marketing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class MarketingMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'marketing_materials';

    protected $fillable = [
        'title', 'material_type', 'description', 'status',
        'platform', 'caption', 'revision_notes', 'publish_date',
        'created_by', 'submitted_by', 'reviewed_by', 'reviewed_at',
        'approved_by', 'approved_at', 'published_by', 'published_at',
        'updated_by',
    ];

    protected $casts = [
        'publish_date'  => 'date',
        'reviewed_at'   => 'datetime',
        'approved_at'   => 'datetime',
        'published_at'  => 'datetime',
    ];

    // ── Constants ─────────────────────────────────────────────────────────────

    public const MATERIAL_TYPES = [
        'poster'            => 'Poster',
        'itinerary'         => 'Itinerary',
        'social_media'      => 'Social Media Post',
        'email_blast'       => 'Email Blast',
        'event_collateral'  => 'Event Collateral',
        'office_material'   => 'Office Material',
        'tv_ad'             => 'TV Ad',
        'other'             => 'Other',
    ];

    public const STATUSES = [
        'draft'     => 'Draft',
        'submitted' => 'Submitted for Review',
        'approved'  => 'Approved',
        'published' => 'Published',
        'archived'  => 'Archived',
    ];

    public const PLATFORMS = [
        'facebook'  => 'Facebook',
        'tiktok'    => 'TikTok',
        'instagram' => 'Instagram',
        'email'     => 'Email',
        'print'     => 'Print',
        'office'    => 'Office / Display',
        'other'     => 'Other',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'submitted_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'published_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'updated_by');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(MarketingExpense::class, 'material_id');
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(MarketingAnalytics::class, 'material_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) return $query;
        return $query->where(function ($q) use ($term) {
            $q->where('title',       'ilike', "%{$term}%")
              ->orWhere('description','ilike', "%{$term}%")
              ->orWhere('caption',    'ilike', "%{$term}%");
        });
    }

    public function scopeForStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('status', $status) : $query;
    }

    public function scopeForType(Builder $query, ?string $type): Builder
    {
        return $type ? $query->where('material_type', $type) : $query;
    }

    public function scopeForYear(Builder $query, ?int $year): Builder
    {
        return $year ? $query->whereYear('created_at', $year) : $query;
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getTypeLabelAttribute(): string
    {
        return self::MATERIAL_TYPES[$this->material_type] ?? $this->material_type;
    }
}
