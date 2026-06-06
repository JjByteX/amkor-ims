<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('collectibles')) {
            return;
        }

        Schema::create('collectibles', function (Blueprint $table) {
            $table->id();

            // ── Origin ──────────────────────────────────────────────────────
            // resa|visa|ormoc
            $table->string('department', 20);
            $table->string('agent_code', 20)->nullable();
            $table->date('date');

            // ── Client ──────────────────────────────────────────────────────
            $table->foreignId('contact_id')
                  ->nullable()
                  ->constrained('contacts')
                  ->nullOnDelete();
            $table->string('customer_name', 255);
            $table->string('corporate_account', 255)->nullable();

            // ── Transaction detail ───────────────────────────────────────────
            $table->text('particulars')->nullable();
            $table->date('travel_date')->nullable();
            $table->string('terms', 100)->nullable();

            // ── Amounts (PHP & USD) ──────────────────────────────────────────
            $table->decimal('collectible_amount_php', 14, 2)->default(0);
            $table->decimal('collectible_amount_usd', 14, 2)->default(0);
            $table->decimal('payment_received_php',   14, 2)->default(0);
            $table->decimal('payment_received_usd',   14, 2)->default(0);
            // balance_php and balance_usd are computed — stored for fast querying
            $table->decimal('balance_php', 14, 2)->default(0);
            $table->decimal('balance_usd', 14, 2)->default(0);

            // ── Dates ────────────────────────────────────────────────────────
            $table->date('due_date')->nullable();
            // days_outstanding: computed at query time from due_date, stored for sorting/filtering
            $table->unsignedSmallInteger('days_outstanding')->default(0);

            // ── Status ───────────────────────────────────────────────────────
            // current|overdue|paid
            $table->string('status', 20)->default('current');

            // ── AR Workflow approval ─────────────────────────────────────────
            // pending|coo_approved|gsm_approved|approved|rejected
            $table->string('approval_status', 30)->default('pending');
            $table->foreignId('approved_by_coo')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('approved_by_coo_at')->nullable();
            $table->foreignId('approved_by_gsm')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('approved_by_gsm_at')->nullable();

            // ── Post-approval actions ────────────────────────────────────────
            $table->boolean('endorsed_to_disbursement')->default(false);
            $table->timestamp('endorsed_to_disbursement_at')->nullable();
            $table->boolean('refund_processed')->default(false);
            $table->timestamp('refund_processed_at')->nullable();
            $table->boolean('documents_endorsed')->default(false);
            $table->timestamp('documents_endorsed_at')->nullable();

            // ── References ───────────────────────────────────────────────────
            $table->string('or_number',  100)->nullable();
            $table->string('ar_number',  100)->nullable();
            $table->string('si_number',  100)->nullable();

            $table->text('remarks')->nullable();
            $table->text('audit_remarks')->nullable();

            // ── Branch & audit ───────────────────────────────────────────────
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
        Schema::dropIfExists('collectibles');
    }
};
