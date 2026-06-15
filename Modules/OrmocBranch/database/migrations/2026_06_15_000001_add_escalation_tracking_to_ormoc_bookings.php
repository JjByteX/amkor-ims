<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add escalation lifecycle tracking to ormoc_bookings.
 *
 * Gap #8 — after an Ormoc booking is escalated to head office, nothing was
 * tracked beyond the flag + email. These columns close the loop:
 *
 *  - escalation_acknowledged_at / _by : RESA officer stamps when they receive
 *    and accept the escalation in the system (replaces the reply-by-email step).
 *  - linked_resa_booking_id           : the RESA booking the QC officer created
 *    from this escalation, so Ormoc can see the outcome without cross-referencing
 *    chat or email.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ormoc_bookings', function (Blueprint $table) {
            // Acknowledgment — set by the RESA officer who picks up the escalation
            $table->timestamp('escalation_acknowledged_at')
                ->nullable()
                ->after('escalated_by');

            $table->foreignId('escalation_acknowledged_by')
                ->nullable()
                ->after('escalation_acknowledged_at')
                ->constrained('users')
                ->nullOnDelete();

            // Link to the RESA booking that was created from this escalation
            $table->foreignId('linked_resa_booking_id')
                ->nullable()
                ->after('escalation_acknowledged_by')
                ->constrained('reservation_bookings')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ormoc_bookings', function (Blueprint $table) {
            $table->dropForeign(['escalation_acknowledged_by']);
            $table->dropForeign(['linked_resa_booking_id']);
            $table->dropColumn([
                'escalation_acknowledged_at',
                'escalation_acknowledged_by',
                'linked_resa_booking_id',
            ]);
        });
    }
};
