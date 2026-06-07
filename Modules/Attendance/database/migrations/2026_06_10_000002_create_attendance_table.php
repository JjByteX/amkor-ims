<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attendance_records')) {
            return;
        }

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();

            // ── Who ───────────────────────────────────────────────────────────
            // Cross-module reference: employee is in EmployeeRecords module.
            // We store user_id (system login) AND employee_id (directory record).
            // employee_id is a soft reference (no FK) to avoid cross-module import.
            $table->unsignedBigInteger('employee_id');          // references employees.id (no FK — cross-module)
            $table->foreignId('user_id')->nullable()            // system login reference
                ->constrained('users')->nullOnDelete();

            // ── When ──────────────────────────────────────────────────────────
            $table->date('work_date');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();

            // Timestamps with timezone precision (server time, PH)
            $table->timestamp('time_in_at')->nullable();        // full datetime of clock-in
            $table->timestamp('time_out_at')->nullable();       // full datetime of clock-out

            // ── Computed on save ──────────────────────────────────────────────
            $table->unsignedSmallInteger('minutes_worked')->nullable();  // time_out - time_in
            $table->unsignedSmallInteger('minutes_late')->nullable();    // vs 8:00 AM threshold
            $table->unsignedSmallInteger('minutes_undertime')->nullable(); // vs 5:00 PM threshold

            // ── Status / type ─────────────────────────────────────────────────
            $table->string('status', 30)->default('present');
            // present | absent | half_day | on_leave | holiday | rest_day

            $table->string('leave_type', 50)->nullable();
            // SIL | VL | SL | EL | official_business | offsetting | etc.

            // ── Location / device ─────────────────────────────────────────────
            $table->string('ip_address', 45)->nullable();       // for audit
            $table->string('device_info', 255)->nullable();

            // ── HR overrides ──────────────────────────────────────────────────
            $table->boolean('hr_override')->default(false);     // was this edited by HR?
            $table->text('override_reason')->nullable();

            // ── Branch (denormalized for fast report queries) ──────────────────
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();

            // ── Remarks ───────────────────────────────────────────────────────
            $table->text('remarks')->nullable();

            // ── Audit ─────────────────────────────────────────────────────────
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // ── Unique: one record per employee per day ───────────────────────
            $table->unique(['employee_id', 'work_date'], 'attendance_employee_date_unique');

            // ── Indexes for report queries ────────────────────────────────────
            $table->index(['employee_id', 'work_date']);
            $table->index(['work_date']);
            $table->index(['branch_id', 'work_date']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
