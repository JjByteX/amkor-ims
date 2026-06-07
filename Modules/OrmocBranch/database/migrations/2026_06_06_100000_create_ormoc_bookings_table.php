<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ormoc_bookings', function (Blueprint $table) {
            $table->id();

            // ── Core ────────────────────────────────────────────────────────
            $table->string('agent_code', 10);
            $table->date('date');

            // ── Client ──────────────────────────────────────────────────────
            $table->string('client_name', 255);
            $table->string('contact_number', 50)->nullable();
            $table->string('email', 255)->nullable();

            // ── Booking type ────────────────────────────────────────────────
            // domestic|international
            $table->string('booking_type', 20)->default('domestic');

            // ── Inquiry / quotation fields ──────────────────────────────────
            $table->string('destination', 255)->nullable();
            $table->date('travel_date')->nullable();
            $table->unsignedSmallInteger('pax_count')->nullable();

            // ── Package quotation fields ────────────────────────────────────
            $table->string('hotel', 255)->nullable();
            $table->string('room_type', 100)->nullable();
            $table->text('flight_details')->nullable();
            $table->text('inclusions')->nullable();
            $table->text('exclusions')->nullable();
            $table->text('remarks')->nullable();

            // ── Financials ──────────────────────────────────────────────────
            $table->decimal('selling_price', 12, 2)->nullable();
            $table->decimal('net_payable', 12, 2)->nullable();
            $table->decimal('income', 12, 2)->nullable();
            $table->decimal('excess', 12, 2)->nullable();
            $table->decimal('insurance_nett', 12, 2)->nullable();
            $table->decimal('acr', 12, 2)->nullable();

            // ── Payment ─────────────────────────────────────────────────────
            // cash|bank_transfer|credit_card
            $table->string('mode_of_payment', 20)->nullable();
            // CC surcharge flag: automatically set to true when MOP = credit_card
            $table->boolean('cc_surcharge_applied')->default(false);
            $table->date('date_of_payment')->nullable();

            // ── References ──────────────────────────────────────────────────
            $table->string('po_number', 100)->nullable();
            $table->string('si_number', 100)->nullable();
            $table->string('or_number', 100)->nullable();
            $table->string('ar_number', 100)->nullable();
            $table->string('soa_number', 100)->nullable();

            // ── Document tracking ───────────────────────────────────────────
            $table->string('transaction_type', 100)->nullable();
            $table->string('source', 100)->nullable();
            $table->text('audit_remarks')->nullable();

            // ── Status ──────────────────────────────────────────────────────
            // inquiry|quoted|confirmed|cancelled
            $table->string('status', 20)->default('inquiry');

            // ── Passport / ID expiry ────────────────────────────────────────
            $table->date('passport_expiry')->nullable();
            // Computed flag: passport_expiry < travel_date + 6 months
            $table->boolean('passport_expiry_flagged')->default(false);

            // ── International escalation ────────────────────────────────────
            $table->boolean('escalated_to_head_office')->default(false);
            $table->timestamp('escalated_at')->nullable();
            $table->foreignId('escalated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // ── PO to Mariposa ──────────────────────────────────────────────
            $table->boolean('po_sent_to_mariposa')->default(false);
            $table->timestamp('po_sent_to_mariposa_at')->nullable();

            // ── Forwarded to Accounting ─────────────────────────────────────
            $table->boolean('forwarded_to_accounting')->default(false);
            $table->timestamp('forwarded_to_accounting_at')->nullable();

            // ── Notes ───────────────────────────────────────────────────────
            $table->text('notes')->nullable();

            // ── Relations ───────────────────────────────────────────────────
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
        Schema::dropIfExists('ormoc_bookings');
    }
};
