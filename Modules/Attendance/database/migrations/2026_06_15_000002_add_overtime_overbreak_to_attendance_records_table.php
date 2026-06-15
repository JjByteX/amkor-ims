<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gap #3 — minutes_overtime and minutes_overbreak missing from attendance_records.
 *
 * The Excel attendance sheet tracks both an Overtime column and an Overbreak column
 * alongside the existing Late and Undertime columns. Neither field was included in
 * the original `create_attendance_table` migration.
 *
 * Both values are computed on save inside AttendanceRecord::computeCounters()
 * (same pattern as minutes_late / minutes_undertime). The model patch ships
 * separately in app/Models/AttendanceRecord.php.
 *
 * Business rules:
 *   minutes_overtime  — minutes worked beyond the scheduled end time (5:00 PM default),
 *                       only counted when status = 'present' and time_out is set.
 *   minutes_overbreak — minutes taken in excess of the 1-hour lunch break window
 *                       (12:00–13:00 by default). Requires a break-start / break-end
 *                       input on the attendance form; stored here after computation.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            // Placed after minutes_undertime to group all duration counters together
            $table->unsignedSmallInteger('minutes_overtime')->nullable()->after('minutes_undertime');
            $table->unsignedSmallInteger('minutes_overbreak')->nullable()->after('minutes_overtime');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['minutes_overtime', 'minutes_overbreak']);
        });
    }
};
