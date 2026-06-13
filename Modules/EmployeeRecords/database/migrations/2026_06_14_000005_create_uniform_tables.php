<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the uniform_issuances table.
 *
 * Gap addressed: the client's Employee Details Excel has an "Issuance of
 * Uniforms" tab tracking per-employee uniform inventory by type. No model
 * or table existed for this.
 *
 * Structure:
 *  - One row per issuance event (employee receives one or more uniform items)
 *  - Uniform types match the Excel column headers exactly
 *  - Beginning inventory is tracked as a separate summary view, not per-row
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uniform_issuances', function (Blueprint $table) {
            $table->id();

            // Cross-module reference to employees — soft reference (no FK)
            $table->unsignedBigInteger('employee_id');

            $table->date('issued_date');

            // Uniform types — column headers from the Excel "Issuance of Uniforms" tab
            $table->unsignedTinyInteger('hoodie_jacket')->default(0);
            $table->unsignedTinyInteger('bomber_jacket')->default(0);
            $table->unsignedTinyInteger('anniversary_shirt')->default(0);
            $table->unsignedTinyInteger('corporate_jacket')->default(0);
            $table->unsignedTinyInteger('amkor_subli_uniform')->default(0);   // "Amkor New Logo Subli Uniform"
            $table->unsignedTinyInteger('amkor_polo_shirt')->default(0);      // "Amkor New Logo Polo Shirt"

            $table->text('remarks')->nullable();

            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index('employee_id');
            $table->index('issued_date');
        });

        // ── Beginning inventory ───────────────────────────────────────────────
        // Tracks the starting stock count per uniform type per year.
        // Matches the "Beginning Inventory" row in the Excel tab.
        Schema::create('uniform_inventory', function (Blueprint $table) {
            $table->id();

            $table->unsignedSmallInteger('year');

            $table->unsignedSmallInteger('hoodie_jacket')->default(0);
            $table->unsignedSmallInteger('bomber_jacket')->default(0);
            $table->unsignedSmallInteger('anniversary_shirt')->default(0);
            $table->unsignedSmallInteger('corporate_jacket')->default(0);
            $table->unsignedSmallInteger('amkor_subli_uniform')->default(0);
            $table->unsignedSmallInteger('amkor_polo_shirt')->default(0);

            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->unique('year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uniform_issuances');
        Schema::dropIfExists('uniform_inventory');
    }
};
