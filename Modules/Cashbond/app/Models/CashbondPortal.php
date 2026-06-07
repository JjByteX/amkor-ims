<?php

namespace Modules\Cashbond\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashbondPortal extends Model
{
    protected $table = 'cashbond_portals';

    protected $fillable = [
        'name',
        'current_balance',
        'maintaining_balance',
        'is_active',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
        'maintaining_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────

    public function reloads(): HasMany
    {
        return $this->hasMany(CashbondReload::class, 'portal_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    public function isBelowThreshold(): bool
    {
        if ($this->maintaining_balance === null) {
            return false;
        }

        return $this->current_balance < $this->maintaining_balance;
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBelowThreshold($query)
    {
        return $query->whereNotNull('maintaining_balance')
            ->whereRaw('current_balance < maintaining_balance');
    }
}
