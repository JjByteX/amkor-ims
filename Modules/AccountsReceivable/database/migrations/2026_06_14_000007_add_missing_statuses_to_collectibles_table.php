<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Expands the collectibles.status column to cover every distinct view/tab
 * found in the client's Excel workbook.
 *
 * Previous statuses: current | overdue | paid
 *
 * New statuses added:
 *   pending   — created, not yet actioned (was missing; lumped into "current")
 *   cancelled — transaction voided
 *   blocking  — group seat block held before booking is confirmed
 *   ibayad    — Filipino "to be paid"; active collection queue item
 *   query     — disputed or unclear transaction flagged for review
 *
 * The status column is a plain varchar — no enum — so this migration only
 * adds the DB comment, updates defaults where needed, and re-seeds any
 * existing "current" rows that were actually in a pending state.
 *
 * Note: "Due Today" is not a stored status. It is derived from due_date
 * in the controller/query layer: WHERE due_date = CURRENT_DATE AND status != 'paid'.
 */
return new class extends Migration
{
    public function up(): void
    {
        // The status column is varchar(20) — the new values fit within that limit.
        // No structural change needed; we update the column comment for documentation.
        Schema::table('collectibles', function (Blueprint $table) {
            $table->string('status', 30)->default('pending')->change();
            // status enum (informal): pending|current|overdue|paid|cancelled|blocking|ibayad|query
        });

        // Migrate existing "current" rows to "pending" only where:
        // - due_date is in the future (not yet actionable)
        // - balance is still outstanding
        // Rows that are past due are already overdue — leave them.
        DB::statement("
            UPDATE collectibles
               SET status = 'pending'
             WHERE status = 'current'
               AND (due_date IS NULL OR due_date > CURRENT_DATE)
               AND (balance_php > 0 OR balance_usd > 0)
               AND deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        // Revert pending → current; other new statuses become current on rollback
        DB::statement("
            UPDATE collectibles
               SET status = 'current'
             WHERE status IN ('pending', 'blocking', 'ibayad', 'query')
               AND deleted_at IS NULL
        ");
        DB::statement("
            UPDATE collectibles SET status = 'current' WHERE status = 'cancelled' AND deleted_at IS NULL
        ");

        Schema::table('collectibles', function (Blueprint $table) {
            $table->string('status', 20)->default('current')->change();
        });
    }
};
