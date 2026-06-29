<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds an explicit airline column to tour_packages.
 *
 * Previously the booking form derived the airline by regex-matching
 * "via [Airline Name]" from the inclusions text. That was fragile —
 * "via PAL" vs "via Philippine Airlines" produced inconsistent values,
 * and packages without the pattern left the field blank silently.
 *
 * Storing it explicitly here means:
 *   - The encoder types it once when setting up the package.
 *   - The booking form reads it directly — no regex, no guessing.
 *   - Bookings are consistent regardless of how the inclusions are worded.
 *   - Nullable — packages with no fixed carrier (e.g. Europe open-jaw)
 *     simply leave it null and the booking's airline field stays editable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_packages', function (Blueprint $table) {
            // Stored after exclusions — groups with the other autofill fields.
            $table->string('airline', 255)->nullable()->after('exclusions');
        });
    }

    public function down(): void
    {
        Schema::table('tour_packages', function (Blueprint $table) {
            $table->dropColumn('airline');
        });
    }
};
