<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('overtime_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();

            $table->date('work_date');
            $table->time('ot_start_time');
            $table->time('ot_end_time');
            $table->unsignedInteger('minutes_requested')->comment('Computed: (ot_end - ot_start) in minutes');

            $table->enum('reason', [
                'rush_workload',
                'client_deadline',
                'branch_coverage',
                'event_function',
                'other',
            ]);

            $table->enum('compensation_type', ['pay', 'leave_credit'])->default('pay');

            $table->text('remarks')->nullable();
            $table->string('attachment_path', 500)->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');

            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();

            $table->timestamp('cancelled_at')->nullable();

            $table->enum('request_type', ['standard', 'pre_approved', 'on_behalf'])->default('standard');
            $table->foreignId('requested_for')->nullable()->constrained('employees')->nullOnDelete()
                  ->comment('"On behalf of" target employee');

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_requests');
    }
};
