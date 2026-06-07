<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('visa_applications')) {
            return;
        }

        Schema::create('visa_applications', function (Blueprint $table) {
            $table->id();

            // ── Core fields ────────────────────────────────────────────────
            $table->string('agent_code', 10);
            $table->date('date');
            $table->string('agency', 255)->nullable();
            $table->string('customer_name', 255);
            $table->string('visa_type', 100);

            // ── Financials ─────────────────────────────────────────────────
            $table->decimal('selling_price', 12, 2)->nullable();
            $table->decimal('net_payable', 12, 2)->nullable();
            $table->decimal('income', 12, 2)->nullable();

            // ── Status & notes ─────────────────────────────────────────────
            // pending|on_process|completed|approved|denied|forfeited|refunded
            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();   // replaces yellow Excel highlighting

            // ── Payment details ────────────────────────────────────────────
            // cash|bdo|bpi|metrobank|card|check
            $table->string('mode_of_payment', 20)->nullable();
            $table->date('payment_date')->nullable();
            $table->string('soa_number', 100)->nullable();
            $table->string('si_number', 100)->nullable();
            $table->string('ar_number', 100)->nullable();

            // ── Embassy payment tracking ───────────────────────────────────
            $table->date('payment_due_date')->nullable();
            $table->boolean('payment_request_sent')->default(false);
            $table->timestamp('payment_request_sent_at')->nullable();

            // ── OR (Official Receipt) tracking ─────────────────────────────
            $table->string('or_number', 100)->nullable();
            $table->timestamp('or_received_at')->nullable();
            $table->timestamp('or_endorsed_at')->nullable();
            $table->foreignId('or_endorsed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // ── Relations ──────────────────────────────────────────────────
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
        Schema::dropIfExists('visa_applications');
    }
};
