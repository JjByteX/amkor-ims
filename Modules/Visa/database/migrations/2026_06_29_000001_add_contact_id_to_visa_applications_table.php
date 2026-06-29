<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fixes a real bug, not a cosmetic gap: VisaApplication::$fillable already
 * lists 'contact_id', and the model already has a contact() relationship
 * (belongsTo Contact). VisaController already reads and writes contact_id
 * directly (link/unlink-to-Contact, and the "other bookings/visas under
 * this same Contact" cross-module lookups). None of that has ever had a
 * column to write to — visa_applications never got this migration, so
 * every one of those code paths throws a SQL error the moment it runs.
 *
 * Column shape matches the contact_id already in use on payables and
 * collectibles (see Modules/AccountsPayable and Modules/AccountsReceivable)
 * for consistency: nullable foreignId → contacts.id, set null on delete
 * (an application shouldn't be deleted just because its linked Contact was).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->foreignId('contact_id')
                ->nullable()
                ->after('embassy_name')
                ->constrained('contacts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('contact_id');
        });
    }
};
