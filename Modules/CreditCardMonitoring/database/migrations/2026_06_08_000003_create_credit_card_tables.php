<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Credit Cards master list ──────────────────────────────────────────
        if (! Schema::hasTable('credit_cards')) {
            Schema::create('credit_cards', function (Blueprint $table) {
                $table->id();

                $table->string('card_name', 255);       // e.g. "BDO Corporate Visa"
                $table->string('bank_name', 100)->nullable();
                $table->string('last_four', 4)->nullable(); // last 4 digits

                // statement_cut_off: day of month (1–31)
                $table->unsignedTinyInteger('statement_cut_off')->nullable();
                // due_day: day of month the payment is due (1–31)
                $table->unsignedTinyInteger('due_day')->nullable();

                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();

                $table->foreignId('created_by')
                      ->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')
                      ->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
            });
        }

        // ── Credit Card Payment records ───────────────────────────────────────
        if (! Schema::hasTable('credit_card_payments')) {
            Schema::create('credit_card_payments', function (Blueprint $table) {
                $table->id();

                $table->foreignId('credit_card_id')
                      ->constrained('credit_cards')
                      ->cascadeOnDelete();

                // Reference: CCP-YYYY-XXXXX
                $table->string('payment_no', 50)->unique();

                $table->decimal('amount', 14, 2);
                $table->date('due_date');
                $table->date('statement_date')->nullable();
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

                // Linked voucher (check voucher for CC payments)
                $table->unsignedBigInteger('voucher_id')->nullable()->index();

                $table->text('remarks')->nullable();
                $table->text('audit_remarks')->nullable();

                $table->foreignId('created_by')
                      ->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')
                      ->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();
            });

            Schema::table('credit_card_payments', function (Blueprint $table) {
                $table->foreign('voucher_id')
                      ->references('id')->on('vouchers')
                      ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_card_payments');
        Schema::dropIfExists('credit_cards');
    }
};
