<?php

namespace Modules\Contacts\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use SoftDeletes;

    protected $table = 'contacts';

    protected $fillable = [
        'type',
        'name',
        'tin',
        'address',
        'contact_person',
        'contact_number',
        'email',
        'payment_terms',
        'currency',
        'account_number',
        'notes',
        'branch_id',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Valid contact types
    public const TYPES = [
        'corporate' => 'Corporate Account',
        'sub_agent' => 'Sub-Agent / Travel Agency',
        'supplier' => 'Supplier / Operator',
        'bank' => 'Bank',
    ];

    // Valid currencies
    public const CURRENCIES = ['PHP', 'USD', 'JPY'];

    // ─── Relationships ────────────────────────────────────────────────────────

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

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
                ->orWhere('contact_person', 'ilike', "%{$term}%")
                ->orWhere('email', 'ilike', "%{$term}%")
                ->orWhere('tin', 'ilike', "%{$term}%");
        });
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? ucfirst($this->type);
    }
}
