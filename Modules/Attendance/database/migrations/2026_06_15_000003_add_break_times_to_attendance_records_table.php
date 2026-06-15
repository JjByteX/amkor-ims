<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gap — break_start / break_end missing from attendance_records.
 *
 * AttendanceRecord::computeOverbreakMinutes() and the HR Form/Self pages
 * read/write break_start and break_end, but neither column existed in the
 * schema. Adds both as nullable time columns, placed after time_out so the
 * "when" columns stay grouped together.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->time('break_start')->nullable()->after('time_out');
            $table->time('break_end')->nullable()->after('break_start');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['break_start', 'break_end']);
        });
    }
};
