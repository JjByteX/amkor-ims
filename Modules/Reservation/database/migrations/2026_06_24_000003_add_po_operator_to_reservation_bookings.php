<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Phase 2.5 — Generalise the Mariposa PO tracking to support any operator.
 *
 * Background: Ormoc escalates international bookings because it operates
 * under QC's registration and authority — not because of a Mariposa-specific
 * rule. Mariposa is the current consolidator, but the operator could change.
 *
 * Approach: add a foreign key to contacts (po_sent_to_operator_id) rather
 * than a free-text string. The contact record is the single source of truth
 * for the operator name, TIN, and contact details. Accounting can then filter
 * "all bookings sent to Mariposa this month" by contact_id rather than by a
 * string match that could drift.
 *
 * Backward compatibility: the old po_sent_to_mariposa (bool) and
 * po_sent_to_mariposa_at (timestamp) columns are left untouched. The
 * controller sets both old and new fields so the frontend keeps working
 * until it is updated to use the new columns.
 *
 * After the frontend is updated, drop po_sent_to_mariposa and
 * po_sent_to_mariposa_at in a follow-up migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            // FK to contacts — the operator this PO was sent to.
            // Nullable: only set when a PO has been sent.
            $table->foreignId('po_sent_to_operator_id')
                ->nullable()
                ->after('po_sent_to_mariposa_at')
                ->constrained('contacts')
                ->nullOnDelete();

            // Timestamp for when the PO was sent to the operator.
            $table->timestamp('po_sent_to_operator_at')
                ->nullable()
                ->after('po_sent_to_operator_id');
        });

        // Back-fill: for any existing bookings where po_sent_to_mariposa = true,
        // set po_sent_to_operator_id to the Mariposa contact record and copy
        // the timestamp. Safe to run on a fresh seed; harmless on an empty table.
        $mariposaId = DB::table('contacts')
            ->where('name', 'Mariposa Travel Agency')
            ->value('id');

        if ($mariposaId) {
            DB::table('reservation_bookings')
                ->where('po_sent_to_mariposa', true)
                ->update([
                    'po_sent_to_operator_id' => $mariposaId,
                    'po_sent_to_operator_at' => DB::raw('po_sent_to_mariposa_at'),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->dropForeign(['po_sent_to_operator_id']);
            $table->dropColumn(['po_sent_to_operator_id', 'po_sent_to_operator_at']);
        });
    }
};
