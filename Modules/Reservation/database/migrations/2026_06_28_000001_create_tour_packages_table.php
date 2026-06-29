<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the tour_packages reference table.
 *
 * This is a company-wide catalogue that mirrors the packages listed on the
 * Amkor Travel website (country → package → inclusions / costs / dates).
 * Staff maintain it once; the booking form uses it to autofill inclusions,
 * exclusions, particulars, and selling price instead of typing them fresh
 * on every transaction.
 *
 * tour_costs  — JSON array of pax-tier price objects stored in USD.
 *               Australia-style:  [{"min_pax": 15, "price": 4480}, {"min_pax": 20, "price": 4100}, …]
 *               China-style (flat): [{"min_pax": 20, "price": 529}]
 *               Autofill picks the highest min_pax that is still ≤ pax_count.
 *
 * departure_dates — JSON array of date+surcharge objects, also in USD.
 *               [{"date": "2026-08-30", "surcharge": 0}, {"date": "2026-09-06", "surcharge": 20}]
 *               Surcharge is added on top of the tier price before conversion.
 *
 * No branch_id — packages are company-wide; both QC and Ormoc use the same directory.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tour_packages')) {
            return;
        }

        Schema::create('tour_packages', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('country', 100);                  // e.g. "Australia", "China"
            $table->string('package_name', 255);             // e.g. "Spectacular Australia"
            $table->string('destinations', 255)->nullable(); // e.g. "Brisbane - Sydney - Canberra - Melbourne"
            $table->unsignedSmallInteger('duration_days')->nullable();
            $table->unsignedSmallInteger('duration_nights')->nullable();

            // Booking form autofill fields
            $table->text('particulars')->nullable();  // Short label: "Spectacular Australia 12D/11N"
            $table->text('inclusions')->nullable();
            $table->text('exclusions')->nullable();

            // Pricing — stored in USD
            // [{"min_pax": 15, "price": 4480}, {"min_pax": 20, "price": 4100}, …]
            // Ordered ascending by min_pax so matching logic iterates predictably.
            $table->json('tour_costs')->nullable();

            // Departure dates with optional peak surcharges — stored in USD
            // [{"date": "2026-07-13", "surcharge": 0}, {"date": "2026-09-06", "surcharge": 20}]
            $table->json('departure_dates')->nullable();

            // Soft-toggleable; deactivated packages no longer appear in the booking form selector
            $table->boolean('is_active')->default(true);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('country');
            $table->index(['country', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_packages');
    }
};
