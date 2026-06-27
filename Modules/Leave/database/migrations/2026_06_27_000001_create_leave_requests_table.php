<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();

            $table->enum('leave_type', [
                'sil',
                'vl',
                'sl',
                'birthday_leave',
                'emergency',
                'official_business',
                'offsetting',
                'other',
            ]);

            $table->date('date_from');
            $table->date('date_to');
            $table->decimal('days_requested', 4, 1)->comment('Supports half-day (0.5)');
            $table->enum('session', ['full_day', 'first_half', 'second_half'])->default('full_day');

            $table->text('remarks')->nullable();
            $table->string('attachment_path', 500)->nullable();

            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'cancelled'])
                  ->default('pending');

            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();

            $table->timestamp('cancelled_at')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
