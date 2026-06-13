<?php

namespace Modules\Reservation\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AirlineRate — manually maintained reference table of airline fares.
 *
 * Staff record/update rates here for quick reference when quoting clients.
 * Not connected to live airline/GDS pricing — purely a manually maintained
 * lookup, confirmed with the client (Phase: Airline Rates).
 *
 * One row per rate entry, dated by effective_date. The Index page filters
 * this same granular data by day/week/month/year via PeriodFilter.
 */
class AirlineRate extends Model
{
    protected $fillable = [
        'airline',
        'origin',
        'destination',
        'fare_class',
        'rate',
        'currency',
        'effective_date',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public const CURRENCIES = [
        'PHP' => 'PHP',
        'USD' => 'USD',
        'JPY' => 'JPY',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('airline', 'ilike', "%{$term}%")
                ->orWhere('origin', 'ilike', "%{$term}%")
                ->orWhere('destination', 'ilike', "%{$term}%")
                ->orWhere('fare_class', 'ilike', "%{$term}%");
        });
    }

    public function scopeBetweenDates($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->whereDate('effective_date', '>=', $from);
        }

        if ($to) {
            $query->whereDate('effective_date', '<=', $to);
        }

        return $query;
    }
}
