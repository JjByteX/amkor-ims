<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bir_transactions')) {
            return;
        }

        Schema::create('bir_transactions', function (Blueprint $table) {
            $table->id();

            // ── Source identification ─────────────────────────────────────────
            // Tracks which module/record this BIR entry originates from.
            // Cross-module link is stored as a generic reference (type + id),
            // not as a FK, to respect the no-cross-module-import rule.
            $table->string('source_type', 50);   // 'booking', 'visa', 'ormoc', 'collectible'
            $table->unsignedBigInteger('source_id')->nullable();

            // ── Document references ───────────────────────────────────────────
            $table->string('document_type', 20);  // 'AR'|'SI'|'SOA'
            $table->string('document_number', 100)->nullable(); // AR-2026-00001, SI-2026-00001

            // ── Client / payer info ───────────────────────────────────────────
            $table->string('client_name', 255);
            $table->string('tin', 50)->nullable();            // Required for AR and SI
            $table->string('address', 500)->nullable();
            $table->string('business_style', 255)->nullable();

            // ── Transaction amounts ───────────────────────────────────────────
            $table->decimal('gross_amount', 14, 2)->default(0);

            // VAT breakdown (required for SI)
            $table->decimal('vatable_sales', 14, 2)->default(0);
            $table->decimal('vat_exempt_sales', 14, 2)->default(0);
            $table->decimal('vat_zero_rated_sales', 14, 2)->default(0);
            $table->decimal('vat_amount', 14, 2)->default(0);         // 12% of vatable_sales
            $table->decimal('total_sales_vat_inclusive', 14, 2)->default(0);

            // Deductions
            $table->decimal('sc_pwd_discount', 14, 2)->default(0);   // Senior Citizen / PWD
            $table->decimal('withholding_tax', 14, 2)->default(0);
            $table->decimal('net_amount_due', 14, 2)->default(0);     // After all deductions

            // ── Payment info ──────────────────────────────────────────────────
            $table->string('mode_of_payment', 50)->nullable();        // Cash|BDO|BPI|Card|Check
            $table->string('check_number', 100)->nullable();
            $table->date('transaction_date');
            $table->date('due_date')->nullable();

            // ── Period / reporting ────────────────────────────────────────────
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');                     // 1–12
            $table->string('branch_code', 20)->nullable();           // QC_MAIN|VISA_CENTRE|ORMOC

            // ── PDF generation tracking ───────────────────────────────────────
            $table->boolean('pdf_generated')->default(false);
            $table->timestamp('pdf_generated_at')->nullable();
            $table->string('pdf_path', 500)->nullable();

            // ── BIR-specific fields ───────────────────────────────────────────
            $table->string('bir_atp_number', 100)->nullable(); // BIR ATP No. 089AU2025 (for SI)
            $table->string('particulars', 500)->nullable();

            // ── Audit ─────────────────────────────────────────────────────────
            $table->text('remarks')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes for report queries ────────────────────────────────────
            $table->index(['year', 'month']);
            $table->index(['document_type', 'year', 'month']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bir_transactions');
    }
};
