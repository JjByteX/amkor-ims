<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bills')) {
            Schema::create('bills', function (Blueprint $table) {
                $table->id();

                // Bill type: utility|membership|permit|premium|supplies|other
                $table->string('bill_type', 50)->default('utility');
                $table->string('name', 255);          // e.g. "Globe Postpaid – Main Office"
                $table->string('account_no', 100)->nullable();
                $table->string('provider', 255)->nullable(); // Globe, MERALCO, etc.

                $table->decimal('amount', 14, 2)->default(0);
                $table->date('due_date');
                $table->date('payment_date')->nullable();

                // Payment method: credit_card|bank_deposit|cash
                $table->string('mode_of_payment', 50)->nullable();

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

                // Linked voucher
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

            Schema::table('bills', function (Blueprint $table) {
                $table->foreign('voucher_id')
                    ->references('id')->on('vouchers')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
