<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('disbursement_entries')) {
            return;
        }

        Schema::create('disbursement_entries', function (Blueprint $table) {
            $table->id();

            $table->date('date');

            // ── Category: cash|check|liaison_admin|liaison_banks ──────────────
            $table->string('category', 50);

            // ── Reference ─────────────────────────────────────────────────────
            $table->string('reference_no', 100)->nullable();
            $table->foreignId('voucher_id')
                  ->nullable()
                  ->constrained('vouchers')
                  ->nullOnDelete();

            // ── Payee / description ───────────────────────────────────────────
            $table->string('payee', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('account_code', 100)->nullable();

            // ── Amount ────────────────────────────────────────────────────────
            $table->string('currency', 5)->default('PHP');
            $table->decimal('amount', 14, 2)->default(0);

            // ── Reconciliation ────────────────────────────────────────────────
            // Fund type: cash_on_hand|cash_on_bank|petty_cash
            $table->string('fund_type', 30)->default('cash_on_hand');

            $table->text('remarks')->nullable();

            // ── Access file batch (sent on 15th/EOM) ──────────────────────────
            $table->date('access_file_period')->nullable(); // e.g. 2026-06-15 or 2026-06-30

            // ── Branch & audit trail ──────────────────────────────────────────
            $table->foreignId('branch_id')
                  ->nullable()
                  ->constrained('branches')
                  ->nullOnDelete();
            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->foreignId('updated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disbursement_entries');
    }
};
