<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employees')) {
            return;
        }

        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            // ── Personal Info ─────────────────────────────────────────────────
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('suffix', 20)->nullable();            // Jr., Sr., III, etc.
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();            // Male|Female|Other
            $table->string('civil_status', 30)->nullable();      // Single|Married|Widowed|Separated

            // ── Employment Info ───────────────────────────────────────────────
            $table->string('employee_code', 50)->unique()->nullable(); // e.g. AMK-001
            $table->string('position', 150);
            $table->string('department', 100)->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('employment_status', 50)->default('probationary');
            // probationary | regular | resigned | terminated

            $table->date('date_hired');
            $table->date('regularization_date')->nullable();
            // tenure is computed: today - date_hired (accessor)

            // ── Government IDs ────────────────────────────────────────────────
            $table->string('sss_number', 50)->nullable();
            $table->string('philhealth_number', 50)->nullable();
            $table->string('pagibig_number', 50)->nullable();
            $table->string('tin_number', 50)->nullable();

            // ── Contact Details ───────────────────────────────────────────────
            $table->string('personal_email', 255)->nullable();
            $table->string('work_email', 255)->nullable();
            $table->string('mobile_number', 30)->nullable();
            $table->text('home_address')->nullable();

            // ── Emergency Contact ─────────────────────────────────────────────
            $table->string('emergency_contact_name', 150)->nullable();
            $table->string('emergency_contact_relationship', 80)->nullable();
            $table->string('emergency_contact_number', 30)->nullable();

            // ── SIL (Service Incentive Leave) ─────────────────────────────────
            $table->unsignedSmallInteger('sil_total')->default(5);     // per year, PH law minimum
            $table->unsignedSmallInteger('sil_used')->default(0);
            // sil_remaining is computed: sil_total - sil_used

            // ── Uniform Issuance ──────────────────────────────────────────────
            // Stored as JSON array: [{date, item, size, quantity, notes}]
            $table->json('uniform_records')->nullable();

            // ── Compliance ────────────────────────────────────────────────────
            $table->boolean('data_privacy_consent')->default(false);
            $table->date('data_privacy_consent_date')->nullable();

            // ── System link (optional — if employee also has a login) ──────────
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // ── Remarks ───────────────────────────────────────────────────────
            $table->text('remarks')->nullable();

            // ── Audit ─────────────────────────────────────────────────────────
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ───────────────────────────────────────────────────────
            $table->index(['employment_status']);
            $table->index(['branch_id', 'employment_status']);
            $table->index(['date_hired']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
