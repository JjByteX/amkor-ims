<?php

namespace Modules\Reservation\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * TourPackage — company-wide tour catalogue reference table.
 *
 * Mirrors the packages listed on the Amkor Travel website.
 * Staff maintain this directory once; the booking form uses it to
 * autofill inclusions, exclusions, particulars, and selling price.
 *
 * No branch_id — packages are shared across QC and Ormoc.
 *
 * tour_costs and departure_dates are JSON columns — see the migration
 * for the expected object shape of each.
 *
 * @property int         $id
 * @property string      $country
 * @property string      $package_name
 * @property string|null $destinations
 * @property int|null    $duration_days
 * @property int|null    $duration_nights
 * @property string|null $particulars
 * @property string|null $inclusions
 * @property string|null $exclusions
 * @property string|null $airline          — explicit carrier name, e.g. "Philippine Airlines". Null = no fixed carrier.
 * @property array|null  $tour_costs       — [{"min_pax": int, "price": float}, …] USD
 * @property array|null  $departure_dates  — [{"date": "Y-m-d", "surcharge": float}, …] USD
 * @property bool        $is_active
 */
class TourPackage extends Model
{
    use SoftDeletes;

    protected $table = 'tour_packages';

    protected $fillable = [
        'country',
        'package_name',
        'destinations',
        'duration_days',
        'duration_nights',
        'particulars',
        'inclusions',
        'exclusions',
        'airline',
        'tour_costs',
        'departure_dates',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tour_costs'      => 'array',
        'departure_dates' => 'array',
        'is_active'       => 'boolean',
        'duration_days'   => 'integer',
        'duration_nights' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /** Filter to active packages only — used by the booking form selector. */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /** Filter by country (case-insensitive). Skipped when $country is null. */
    public function scopeByCountry($query, ?string $country)
    {
        if (! $country) {
            return $query;
        }

        return $query->where('country', 'ilike', $country);
    }

    /** Search across country and package_name. Skipped when $term is null. */
    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('country', 'ilike', "%{$term}%")
                ->orWhere('package_name', 'ilike', "%{$term}%")
                ->orWhere('destinations', 'ilike', "%{$term}%");
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Returns the distinct list of active countries for the directory
     * filter dropdown, sorted alphabetically.
     *
     * @return array<string>
     */
    public static function countries(): array
    {
        return static::active()
            ->distinct()
            ->orderBy('country')
            ->pluck('country')
            ->toArray();
    }

    /**
     * Returns the applicable USD price for a given pax count.
     *
     * Picks the highest min_pax tier that is still ≤ $paxCount.
     * Returns null if tour_costs is empty or no tier matches.
     *
     * Example (Australia):
     *   tour_costs = [{"min_pax": 15, "price": 4480}, {"min_pax": 20, "price": 4100}, {"min_pax": 25, "price": 3880}]
     *   priceForPax(22) → 4100  (MIN 20 applies; MIN 25 does not)
     *   priceForPax(10) → null  (below the lowest tier)
     */
    public function priceForPax(int $paxCount): ?float
    {
        if (empty($this->tour_costs)) {
            return null;
        }

        $applicable = null;

        foreach ($this->tour_costs as $tier) {
            $minPax = (int) ($tier['min_pax'] ?? 0);
            $price  = (float) ($tier['price'] ?? 0);

            if ($paxCount >= $minPax) {
                // Keep updating — tiers are ordered ascending, so the last
                // matching one is always the highest qualifying threshold.
                $applicable = $price;
            }
        }

        return $applicable;
    }

    /**
     * Returns the lowest published USD price across all tiers.
     * Used as the "from $X" display value in the directory table.
     *
     * For Australia this is the MIN 25 tier (cheapest per pax at max group).
     * For China flat-price packages this is simply the one price.
     *
     * Returns null if tour_costs is empty.
     */
    public function lowestPrice(): ?float
    {
        if (empty($this->tour_costs)) {
            return null;
        }

        return min(array_column($this->tour_costs, 'price'));
    }

    /**
     * Returns the first upcoming departure date object, or null if none exist.
     *
     * "Upcoming" = date is today or in the future.
     * Used by the booking form to pre-select the nearest available date.
     *
     * @return array{date: string, surcharge: float}|null
     */
    public function nextDeparture(): ?array
    {
        if (empty($this->departure_dates)) {
            return null;
        }

        $today = now()->toDateString();

        foreach ($this->departure_dates as $entry) {
            if (isset($entry['date']) && $entry['date'] >= $today) {
                return $entry;
            }
        }

        return null;
    }
}
