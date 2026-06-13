<?php

namespace Modules\EmployeeRecords\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Tracks uniform items issued to each employee.
 * Maps directly to the "Issuance of Uniforms" tab in the client's Excel workbook.
 *
 * Uniform type columns match the Excel headers exactly:
 *  - Hoodie Jacket
 *  - Bomber Jacket
 *  - Anniversary Shirt
 *  - Corporate Jacket
 *  - Amkor New Logo Subli Uniform
 *  - Amkor New Logo Polo Shirt
 */
class UniformIssuance extends Model
{
    use SoftDeletes;

    protected $table = 'uniform_issuances';

    protected $fillable = [
        'employee_id',
        'issued_date',
        'hoodie_jacket',
        'bomber_jacket',
        'anniversary_shirt',
        'corporate_jacket',
        'amkor_subli_uniform',
        'amkor_polo_shirt',
        'remarks',
        'issued_by',
        'created_by',
    ];

    protected $casts = [
        'issued_date' => 'date',
    ];

    // Uniform type labels — keys match column names, values match Excel headers
    public const UNIFORM_TYPES = [
        'hoodie_jacket'       => 'Hoodie Jacket',
        'bomber_jacket'       => 'Bomber Jacket',
        'anniversary_shirt'   => 'Anniversary Shirt',
        'corporate_jacket'    => 'Corporate Jacket',
        'amkor_subli_uniform' => 'Amkor New Logo Subli Uniform',
        'amkor_polo_shirt'    => 'Amkor New Logo Polo Shirt',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    /**
     * Soft reference — Employee is in the same module so this is a real FK.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForYear(Builder $query, int $year): Builder
    {
        return $query->whereYear('issued_date', $year);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Total items issued across all types in this issuance record.
     */
    public function totalItems(): int
    {
        return (int) $this->hoodie_jacket
            + (int) $this->bomber_jacket
            + (int) $this->anniversary_shirt
            + (int) $this->corporate_jacket
            + (int) $this->amkor_subli_uniform
            + (int) $this->amkor_polo_shirt;
    }

    /**
     * Aggregate totals per uniform type for a given set of employee IDs.
     * Returns an array keyed by uniform type column name.
     */
    public static function totalsForEmployees(array $employeeIds, ?int $year = null): array
    {
        $query = static::whereIn('employee_id', $employeeIds);
        if ($year) {
            $query->whereYear('issued_date', $year);
        }

        $result = $query->selectRaw('
            SUM(hoodie_jacket) as hoodie_jacket,
            SUM(bomber_jacket) as bomber_jacket,
            SUM(anniversary_shirt) as anniversary_shirt,
            SUM(corporate_jacket) as corporate_jacket,
            SUM(amkor_subli_uniform) as amkor_subli_uniform,
            SUM(amkor_polo_shirt) as amkor_polo_shirt
        ')->first();

        return $result ? $result->toArray() : array_fill_keys(array_keys(self::UNIFORM_TYPES), 0);
    }
}
