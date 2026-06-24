<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.1 — Add contact_person to reservation_bookings.
 *
 * Both the QC RESA and Ormoc Excel files have a "Contact Person" column
 * distinct from the passenger name. For corporate bookings this is the
 * travel coordinator; for FIT it is usually the same as the passenger
 * (leave null). Free-text — no foreign key needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->string('contact_person', 255)->nullable()->after('client_name');
        });
    }

    public function down(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->dropColumn('contact_person');
        });
    }
};
