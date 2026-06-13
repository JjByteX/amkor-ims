<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds fields identified as gaps when cross-referencing the client's
 * Excel workbook (QC RESA / Ormoc Sales Ledger tabs) against the
 * existing reservation_bookings table.
 *
 * Gaps addressed:
 *  - Airline          — carrier for the booking (e.g. "PAL", "Cebu Pacific")
 *  - Excess           — overpayment / rounding column (SP - NP - Income)
 *  - Insurance (Nett) — net insurance cost, separate line from SP/NP/Income
 *  - Transaction Type — FIT / Corporate / Group / Blocking (maps to service_type
 *                       but labelled differently in the Excel; added as explicit
 *                       column so reports match the Excel header exactly)
 *  - Date of Birth    — passenger DOB per the For Collection sheet
 *  - Source           — referral source (walk-in, sub-agent, online, etc.)
 *  - Agent codes      — constant updated to match seeder (was a known hardcoded gap)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {

            // Airline carrier — appears in both QC RESA and Ormoc ledgers
            $table->string('airline', 100)->nullable()->after('destination');

            // Excess = SP - NP - Income (rounding / override column in Excel)
            $table->decimal('excess', 14, 2)->default(0)->after('income');

            // Insurance nett cost — tracked separately from the main income calc
            $table->decimal('insurance_nett', 14, 2)->nullable()->after('excess');

            // Transaction type as labelled in Excel: FIT, Corporate, Group, Blocking
            // Coexists with service_type; this maps directly to the Excel column header
            $table->string('transaction_type', 80)->nullable()->after('service_type');

            // Passenger date of birth — appears in For Collection tab
            $table->date('date_of_birth')->nullable()->after('client_name');

            // Source — referral channel (walk-in, sub-agent, expo, online, etc.)
            $table->string('source', 100)->nullable()->after('audit_remarks');
        });
    }

    public function down(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'airline',
                'excess',
                'insurance_nett',
                'transaction_type',
                'date_of_birth',
                'source',
            ]);
        });
    }
};
