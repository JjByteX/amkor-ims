<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gap #12 — adds salary increase tracking to the employees table.
 *
 * Fields added:
 *   salary_increase_amount  — the new gross salary after the increase
 *   salary_increase_date    — effective date of the increase
 *
 * Placed after the existing patch migration 2026_06_14_000006.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Amount is the new salary (or the increment — store as full amount
            // so HR can compare directly to the previous figure in history).
            $table->decimal('salary_increase_amount', 12, 2)->nullable()->after('remarks');
            $table->date('salary_increase_date')->nullable()->after('salary_increase_amount');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['salary_increase_amount', 'salary_increase_date']);
        });
    }
};
