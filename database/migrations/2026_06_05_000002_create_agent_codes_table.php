<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Stores the agent codes used across RESA, Visa, and Ormoc departments.
     * Agent codes are short identifiers (e.g. RT, RP, ALEX) used on bookings,
     * visa applications, and sales reports. They are not system user accounts —
     * a single user may carry one or more codes, or codes may be shared
     * (e.g. MMT appears in RESA, Visa, and Ormoc groups).
     *
     * department enum:
     *   resa    — QC Reservation & Booking
     *   visa    — Visa & Documentation
     *   ormoc   — Ormoc Branch
     */
    public function up(): void
    {
        Schema::create('agent_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10);
            $table->enum('department', ['resa', 'visa', 'ormoc']);
            $table->enum('sub_group', ['individual', 'groups'])->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // A code is unique within its department
            $table->unique(['code', 'department']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_codes');
    }
};
