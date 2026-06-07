<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('iata_payments')) {
            Schema::create('iata_payments', function (Blueprint $table) {
                $table->id();

                // Reference: IATA-YYYY-XXXXX
                $table->string('payment_no', 50)->unique();

                // Operator (from contacts directory)
                $table->foreignId('contact_id')
                    ->nullable()->constrained('contacts')->nullOnDelete();
                $table->string('operator_name', 255); // stored for history even if contact deleted

                $table->string('billing_reference', 100)->nullable(); // billing confirmation # from operator
                $table->date('billing_date')->nullable();
                $table->date('due_date');

                $table->decimal('amount', 14, 2);
                $table->date('payment_date')->nullable();

                // Status: pending|paid|overdue
                $table->string('status', 20)->default('pending');

                // Approval chain: pending|checked|approved|released
                $table->string('approval_status', 30)->default('pending');
                $table->foreignId('checked_by')
                    ->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('checked_at')->nullable();
                $table->foreignId('approved_by')
                    ->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('released_by')
                    ->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('released_at')->nullable();

                // Deposit slip
                $table->boolean('deposit_slip_attached')->default(false);
                $table->timestamp('deposit_slip_attached_at')->nullable();

                // Operator notification
                $table->boolean('operator_notified')->default(false);
                $table->timestamp('operator_notified_at')->nullable();

                // Linked voucher (check voucher for IATA payments)
                $table->unsignedBigInteger('voucher_id')->nullable()->index();

                $table->text('remarks')->nullable();
                $table->text('audit_remarks')->nullable();

                $table->foreignId('branch_id')
                    ->nullable()->constrained('branches')->nullOnDelete();
                $table->foreignId('created_by')
                    ->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')
                    ->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();
            });

            Schema::table('iata_payments', function (Blueprint $table) {
                $table->foreign('voucher_id')
                    ->references('id')->on('vouchers')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('iata_payments');
    }
};
