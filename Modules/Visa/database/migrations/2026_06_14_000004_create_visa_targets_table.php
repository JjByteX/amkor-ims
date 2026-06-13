<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the visa_targets table.
 *
 * Gap addressed: the Visa Monthly Sales Report Excel has a monthly income
 * target column (₱700,000/month). There was no place to store this in the
 * system. This table stores the target per month/year so the progress report
 * view can compute % achieved vs target.
 *
 * The SalesSummary module already has a sales_targets table for the overall
 * summary report. This table is Visa-specific and scoped to the Visa module.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visa_targets', function (Blueprint $table) {
            $table->id();

            $table->unsignedTinyInteger('month');    // 1–12
            $table->unsignedSmallInteger('year');

            // Monthly income target in PHP (e.g. 700000.00)
            $table->decimal('income_target', 14, 2)->default(0);

            // SP and NP targets are optional — income is the primary KPI
            $table->decimal('sp_target', 14, 2)->nullable();
            $table->decimal('np_target', 14, 2)->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['month', 'year'], 'visa_targets_month_year_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visa_targets');
    }
};
