<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.2 — Add surcharge_amount to reservation_bookings.
 *
 * cc_surcharge_applied (boolean) tells you a surcharge was charged.
 * surcharge_amount (decimal) tells you how much — needed by Accounting
 * to reconcile total CC surcharge collected per month.
 *
 * Calculation: selling_price × 0.05.  Staff enter the final selling
 * price (already inclusive of the 5%); the system back-calculates the
 * surcharge for reconciliation only. Set automatically in
 * ReservationController::store() and update() — not entered by staff.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->decimal('surcharge_amount', 10, 2)->nullable()->after('cc_surcharge_applied');
        });
    }

    public function down(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->dropColumn('surcharge_amount');
        });
    }
};
