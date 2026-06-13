<?php

namespace Modules\EmployeeRecords\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tracks beginning inventory of each uniform type per year.
 * Maps to the "Beginning Inventory" row in the Excel "Issuance of Uniforms" tab.
 *
 * One row per year. Remaining stock = beginning_inventory - total_issued.
 */
class UniformInventory extends Model
{
    protected $table = 'uniform_inventory';

    protected $fillable = [
        'year',
        'hoodie_jacket',
        'bomber_jacket',
        'anniversary_shirt',
        'corporate_jacket',
        'amkor_subli_uniform',
        'amkor_polo_shirt',
        'notes',
        'created_by',
        'updated_by',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Remaining stock per type after subtracting total issuances.
     * Returns an array keyed by uniform type column name.
     */
    public function remainingStock(array $totalIssued): array
    {
        $remaining = [];
        foreach (UniformIssuance::UNIFORM_TYPES as $col => $label) {
            $beginning = (int) ($this->{$col} ?? 0);
            $issued    = (int) ($totalIssued[$col] ?? 0);
            $remaining[$col] = max(0, $beginning - $issued);
        }

        return $remaining;
    }

    public static function forYear(int $year): ?self
    {
        return static::where('year', $year)->first();
    }
}
