<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Merge: Ormoc Branch → Reservation & Booking
 *
 * Adds all Ormoc-specific columns to reservation_bookings as nullable columns.
 * QC-origin bookings leave these null; Ormoc-origin bookings populate them.
 *
 * Also adds `tin` to branches so BIR documents can show the correct
 * registered TIN per branch (Main: 223-586-994-00000, Ormoc: 223-586-994-001).
 *
 * The ormoc_bookings table is dropped — no live data exists, confirmed before running.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Extend reservation_bookings with Ormoc-specific columns ────────

        Schema::table('reservation_bookings', function (Blueprint $table) {

            // Booking type — domestic / international; gates the escalation flow.
            // Set to 'international' automatically when a booking is escalated.
            $table->string('booking_type', 20)->nullable()->after('service_type');

            // Package quotation fields Ormoc captures
            $table->string('hotel', 255)->nullable()->after('airline');
            $table->string('room_type', 100)->nullable()->after('hotel');
            $table->text('flight_details')->nullable()->after('room_type');

            // Passport expiry — flagged if expiry < travel_date + 6 months
            $table->date('passport_expiry')->nullable()->after('date_of_birth');
            $table->boolean('passport_expiry_flagged')->default(false)->after('passport_expiry');

            // Credit card surcharge — auto-set when MOP = credit_card (Ormoc only, 5%)
            $table->boolean('cc_surcharge_applied')->default(false)->after('mode_of_payment');

            // Date of payment (when payment was actually received — Ormoc uses this
            // instead of payment_due_date which tracks when it is due)
            $table->date('date_of_payment')->nullable()->after('cc_surcharge_applied');

            // Freeform notes field (separate from remarks)
            $table->text('notes')->nullable()->after('audit_remarks');

            // ── Escalation columns ───────────────────────────────────────────
            // Set when branch_supervisor escalates an international booking to QC
            $table->boolean('escalated_to_head_office')->default(false)->after('notes');
            $table->timestamp('escalated_at')->nullable()->after('escalated_to_head_office');
            $table->foreignId('escalated_by')
                ->nullable()
                ->after('escalated_at')
                ->constrained('users')
                ->nullOnDelete();

            // Set by the QC sales_ticketing_officer when they accept the escalation
            $table->timestamp('escalation_acknowledged_at')->nullable()->after('escalated_by');
            $table->foreignId('escalation_acknowledged_by')
                ->nullable()
                ->after('escalation_acknowledged_at')
                ->constrained('users')
                ->nullOnDelete();

            // Link to the RESA booking the QC officer creates from this escalation
            // Self-referential FK on the same table
            $table->foreignId('linked_resa_booking_id')
                ->nullable()
                ->after('escalation_acknowledged_by')
                ->constrained('reservation_bookings')
                ->nullOnDelete();

            // ── Mariposa PO tracking ─────────────────────────────────────────
            // Set when Ormoc sends the PO to Mariposa (external consolidator)
            $table->boolean('po_sent_to_mariposa')->default(false)->after('linked_resa_booking_id');
            $table->timestamp('po_sent_to_mariposa_at')->nullable()->after('po_sent_to_mariposa');
        });

        // ── 2. Add TIN to branches ────────────────────────────────────────────

        Schema::table('branches', function (Blueprint $table) {
            $table->string('tin', 30)->nullable()->after('code');
        });

        // ── 3. Seed TINs for existing branches ───────────────────────────────

        DB::table('branches')->where('code', 'QC_MAIN')->update(['tin' => '223-586-994-00000']);
        DB::table('branches')->where('code', 'ORMOC')->update(['tin' => '223-586-994-001']);

        // ── 4. Drop the now-redundant ormoc_bookings table ───────────────────
        // Confirmed: no live data exists. All seeded data is disposable.

        Schema::dropIfExists('ormoc_bookings');
    }

    public function down(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->dropForeign(['escalated_by']);
            $table->dropForeign(['escalation_acknowledged_by']);
            $table->dropForeign(['linked_resa_booking_id']);

            $table->dropColumn([
                'booking_type',
                'hotel',
                'room_type',
                'flight_details',
                'passport_expiry',
                'passport_expiry_flagged',
                'cc_surcharge_applied',
                'date_of_payment',
                'notes',
                'escalated_to_head_office',
                'escalated_at',
                'escalated_by',
                'escalation_acknowledged_at',
                'escalation_acknowledged_by',
                'linked_resa_booking_id',
                'po_sent_to_mariposa',
                'po_sent_to_mariposa_at',
            ]);
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('tin');
        });
    }
};
