<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gap #6 — Multi-line SOA support.
 *
 * The current `bir_transactions` table has a single `gross_amount` column and
 * a single `particulars` string. A real SOA has multiple line items — each with
 * its own date, description, and amount — before arriving at a grand total.
 *
 * Example SOA rows from the client Excel:
 *   01/15/2026  Air ticket — HKG–MNL (2 pax)    12,500.00
 *   01/15/2026  Visa processing — HK            4,200.00
 *   01/20/2026  Travel insurance                  890.00
 *                                    TOTAL:     17,590.00
 *
 * Strategy:
 *   - Add a `line_items` JSON column to store the array of rows.
 *   - `gross_amount` becomes the computed grand total (still stored for
 *     backward compatibility with AR and SI, which remain single-line).
 *   - The `particulars` column is retained as a free-text field for
 *     single-line AR/SI use and as a summary for SOA.
 *
 * JSON schema for each line_item entry:
 *   {
 *     "date":        "2026-01-15",   // ISO date string
 *     "description": "Air ticket…",  // free text
 *     "amount":      12500.00        // numeric
 *   }
 *
 * The model accessor `line_items_total` keeps gross_amount in sync on save.
 * See BirTransaction model for the boot hook.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bir_transactions', function (Blueprint $table) {
            // JSON array of { date, description, amount } objects.
            // Nullable so existing AR/SI records are unaffected.
            $table->json('line_items')->nullable()->after('particulars');
        });
    }

    public function down(): void
    {
        Schema::table('bir_transactions', function (Blueprint $table) {
            $table->dropColumn('line_items');
        });
    }
};
