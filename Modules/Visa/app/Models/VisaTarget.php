<?php

namespace Modules\Visa\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Monthly income target for the Visa & Documentation department.
 * Used by the Visa Monthly Sales Report to compute progress vs target.
 *
 * The default monthly target is ₱700,000 per the client's Excel workbook.
 */
class VisaTarget extends Model
{
    protected $table = 'visa_targets';

    protected $fillable = [
        'month',
        'year',
        'income_target',
        'sp_target',
        'np_target',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'income_target' => 'decimal:2',
        'sp_target'     => 'decimal:2',
        'np_target'     => 'decimal:2',
    ];

    // Default monthly income target from the client's Excel workbook
    public const DEFAULT_MONTHLY_TARGET = 700000.00;

    // ── Relationships ─────────────────────────────────────────────────────────

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForYear(Builder $query, int $year): Builder
    {
        return $query->where('year', $year);
    }

    public function scopeForMonth(Builder $query, int $year, int $month): Builder
    {
        return $query->where('year', $year)->where('month', $month);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Retrieve the target for a given month/year, falling back to the default.
     */
    public static function targetFor(int $year, int $month): float
    {
        $record = static::where('year', $year)->where('month', $month)->first();

        return $record ? (float) $record->income_target : self::DEFAULT_MONTHLY_TARGET;
    }

    /**
     * Cumulative target for months 1 through $upToMonth in a given year.
     */
    public static function cumulativeTarget(int $year, int $upToMonth): float
    {
        $total = 0.0;
        for ($m = 1; $m <= $upToMonth; $m++) {
            $total += self::targetFor($year, $m);
        }

        return $total;
    }
}
