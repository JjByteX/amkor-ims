<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('vouchers')) {
            return;
        }

        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();

            // ── Voucher type: cash|check ──────────────────────────────────────
            $table->string('type', 20); // cash|check

            // ── Voucher number (auto-generated: CV-YYYY-XXXXX or CHV-YYYY-XXXXX)
            $table->string('voucher_no', 50)->unique();

            $table->date('date');

            // ── Payee ─────────────────────────────────────────────────────────
            $table->string('payee', 255);
            $table->string('payee_address', 500)->nullable();

            // ── For check vouchers ────────────────────────────────────────────
            $table->string('check_no', 100)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->date('check_date')->nullable();

            // ── Payment details ───────────────────────────────────────────────
            $table->text('details')->nullable(); // narrative of what payment is for
            $table->string('account_code', 100)->nullable();
            $table->string('account_description', 255)->nullable();

            // ── Amount ────────────────────────────────────────────────────────
            $table->string('currency', 5)->default('PHP');
            $table->decimal('amount', 14, 2)->default(0);
            $table->decimal('amount_usd', 14, 2)->default(0);
            $table->decimal('amount_jpy', 14, 2)->default(0);

            // ── Approval chain: pending|checked|approved|released ─────────────
            $table->string('approval_status', 30)->default('pending');
            $table->foreignId('checked_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('checked_at')->nullable();
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('released_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('released_at')->nullable();

            // ── PDF generation stub ───────────────────────────────────────────
            $table->boolean('pdf_generated')->default(false);
            $table->timestamp('pdf_generated_at')->nullable();

            $table->text('remarks')->nullable();

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
        Schema::dropIfExists('vouchers');
    }
};
