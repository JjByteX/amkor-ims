<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — add a nullable FK from payables back to visa_applications.
 *
 * The listener (CreatePayableFromVisaPaymentRequest) already stores a
 * human-readable "VISA-{id}" string in the `acr` column for display
 * purposes. This column adds a proper relational link for joins/queries.
 *
 * Nullable because most payables are NOT sourced from a visa application.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payables', function (Blueprint $table) {
            $table->foreignId('visa_application_id')
                ->nullable()
                ->after('voucher_id')
                ->constrained('visa_applications')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payables', function (Blueprint $table) {
            $table->dropForeignIdFor(\Modules\Visa\Models\VisaApplication::class);
            $table->dropColumn('visa_application_id');
        });
    }
};
