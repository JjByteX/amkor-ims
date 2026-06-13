<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds `date_received` to `payables`.
 *
 * Excel source: "Date Received" column in the Visa "For Collection" / "Expo"
 * sheets — the date the operator/embassy confirmed receipt of the payment
 * (CV) and returned/acknowledged the OR. Paired with the new
 * Payable::STATUSES['received'] state.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payables', function (Blueprint $table) {
            if (! Schema::hasColumn('payables', 'date_received')) {
                $table->date('date_received')->nullable()->after('payment_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payables', function (Blueprint $table) {
            if (Schema::hasColumn('payables', 'date_received')) {
                $table->dropColumn('date_received');
            }
        });
    }
};
