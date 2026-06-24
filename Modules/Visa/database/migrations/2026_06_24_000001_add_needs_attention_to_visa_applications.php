<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.3 — Add needs_attention flag to visa_applications.
 *
 * The Visa Excel uses yellow row highlighting for applications that need
 * a note or follow-up. This adds the system equivalent:
 *
 *   needs_attention   — boolean toggle (replaces the manual yellow highlight)
 *   attention_reason  — optional free-text note explaining why it was flagged
 *                       (e.g. "Embassy appointment moved, confirm new date")
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->boolean('needs_attention')->default(false)->after('remarks');
            $table->string('attention_reason', 500)->nullable()->after('needs_attention');
        });
    }

    public function down(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->dropColumn(['needs_attention', 'attention_reason']);
        });
    }
};
