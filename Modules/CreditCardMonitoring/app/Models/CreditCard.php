<?php

namespace Modules\CreditCardMonitoring\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditCard extends Model
{
    protected $table = 'credit_cards';

    protected $fillable = [
        'card_name',
        'bank_name',
        'last_four',
        'statement_cut_off',
        'due_day',
        'is_active',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'statement_cut_off' => 'integer',
        'due_day'           => 'integer',
        'is_active'         => 'boolean',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────

    public function payments(): HasMany
    {
        return $this->hasMany(CreditCardPayment::class, 'credit_card_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
