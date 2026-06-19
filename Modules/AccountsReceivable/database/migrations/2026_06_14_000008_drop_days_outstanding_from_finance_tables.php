<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drops the stored days_outstanding column from all four finance tables:
 * collectibles, payables, bills, and iata_payments.
 *
 * Reason: days_outstanding = TODAY - due_date. It is a pure formula — the
 * same formula the Excel used. Storing it is wasteful and produces stale
 * values between nightly sweeps. All four models now expose a
 * getDaysOutstandingAttribute() accessor that computes this live every time
 * it is read.
 *
 * The nightly SweepOverdue command no longer needs to update this column.
 * Any code that previously sorted/filtered by days_outstanding in raw SQL
 * should be rewritten to order by due_date instead (earlier due_date = more
 * days outstanding).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collectibles', function (Blueprint $table) {
            if (Schema::hasColumn('collectibles', 'days_outstanding')) {
                $table->dropColumn('days_outstanding');
            }
        });

        Schema::table('payables', function (Blueprint $table) {
            if (Schema::hasColumn('payables', 'days_outstanding')) {
                $table->dropColumn('days_outstanding');
            }
        });

        Schema::table('bills', function (Blueprint $table) {
            if (Schema::hasColumn('bills', 'days_outstanding')) {
                $table->dropColumn('days_outstanding');
            }
        });

        Schema::table('iata_payments', function (Blueprint $table) {
            if (Schema::hasColumn('iata_payments', 'days_outstanding')) {
                $table->dropColumn('days_outstanding');
            }
        });
    }

    public function down(): void
    {
        Schema::table('collectibles', function (Blueprint $table) {
            $table->unsignedInteger('days_outstanding')->default(0)->after('due_date');
        });

        Schema::table('payables', function (Blueprint $table) {
            $table->unsignedInteger('days_outstanding')->default(0)->after('due_date');
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->unsignedInteger('days_outstanding')->default(0)->after('due_date');
        });

        Schema::table('iata_payments', function (Blueprint $table) {
            $table->unsignedInteger('days_outstanding')->default(0)->after('due_date');
        });
    }
};
