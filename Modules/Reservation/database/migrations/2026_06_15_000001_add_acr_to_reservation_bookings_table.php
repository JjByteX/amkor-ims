<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gap #1 — ACR column missing from reservation_bookings.
 *
 * The ACR (Acknowledgement Receipt) reference number appears in both the QC RESA
 * and Ormoc sales ledger Excel sheets as a distinct column. It is already present
 * on the `payables` table but was never added to `reservation_bookings`.
 *
 * This migration adds it so the RESA form can store and display the ACR number
 * alongside the existing SOA# / SI# / AR# reference columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            // Placed after the existing `ar_number` column to mirror Excel column order
            $table->string('acr', 100)->nullable()->after('ar_number');
        });
    }

    public function down(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->dropColumn('acr');
        });
    }
};
