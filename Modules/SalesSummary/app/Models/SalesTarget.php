<?php

namespace Modules\SalesSummary\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesTarget extends Model
{
    protected $fillable = [
        'department',
        'branch_id',
        'agent_code',
        'year',
        'month',
        'target_amount',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
    ];

    public const DEPARTMENTS = [
        'reservation' => 'Reservation',   // QC individual/RESA bookings
        'groups'      => 'Groups',         // Phase 3.7 — QC groups sub-group
        'ormoc'       => 'Ormoc Branch',
        'visa'        => 'Visa & Documentation',
        'ar'          => 'Accounts Receivable',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
