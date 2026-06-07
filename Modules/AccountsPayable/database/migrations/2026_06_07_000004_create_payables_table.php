<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payables')) {
            return;
        }

        Schema::create('payables', function (Blueprint $table) {
            $table->id();

            // ── Reference numbers ─────────────────────────────────────────────
            $table->string('requisition_no', 100)->nullable();
            $table->date('invoice_date')->nullable();
            $table->string('invoice_no', 100)->nullable();

            // ── Supplier ──────────────────────────────────────────────────────
            $table->foreignId('contact_id')
                ->nullable()
                ->constrained('contacts')
                ->nullOnDelete();
            $table->string('supplier_name', 255);

            // ── Primary currency of the invoice ───────────────────────────────
            // PHP|USD|JPY — governs which amount field is the "main" invoice amount
            // USD invoices are always settled in cash (not check) — rule enforced in app layer
            $table->string('currency', 5)->default('PHP');
            $table->decimal('invoice_amount_php', 14, 2)->default(0);
            $table->decimal('invoice_amount_usd', 14, 2)->default(0);
            $table->decimal('invoice_amount_jpy', 14, 2)->default(0);

            // ── Payment amounts (tracked separately for partials) ─────────────
            $table->decimal('payment_php', 14, 2)->default(0);
            $table->decimal('payment_usd', 14, 2)->default(0);
            $table->decimal('payment_jpy', 14, 2)->default(0);

            // ── Balances (computed + stored for querying) ─────────────────────
            $table->decimal('balance_php', 14, 2)->default(0);
            $table->decimal('balance_usd', 14, 2)->default(0);
            $table->decimal('balance_jpy', 14, 2)->default(0);

            // ── Dates ─────────────────────────────────────────────────────────
            $table->date('due_date')->nullable();
            $table->unsignedSmallInteger('days_outstanding')->default(0);
            $table->date('payment_date')->nullable();

            // ── Status: pending|paid|overdue|filed ────────────────────────────
            $table->string('status', 20)->default('pending');

            // ── Approval chain ────────────────────────────────────────────────
            // pending|checked|approved|released
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

            // ── Payment method ────────────────────────────────────────────────
            // cash|check|bank_deposit
            // USD transactions → always cash
            $table->string('mode_of_payment', 50)->nullable();
            $table->string('account_no', 100)->nullable();
            $table->string('acr', 100)->nullable();
            $table->string('check_no', 100)->nullable();

            // ── Deposit slip ──────────────────────────────────────────────────
            $table->boolean('deposit_slip_attached')->default(false);
            $table->timestamp('deposit_slip_attached_at')->nullable();

            // ── Linked voucher (nullable unsignedBigInteger; FK added post-create) ──
            $table->unsignedBigInteger('voucher_id')->nullable()->index();

            $table->text('remarks')->nullable();
            $table->text('audit_remarks')->nullable();

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

        // Add FK to vouchers after that table is created (migration order)
        Schema::table('payables', function (Blueprint $table) {
            $table->foreign('voucher_id')
                ->references('id')->on('vouchers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payables');
    }
};
