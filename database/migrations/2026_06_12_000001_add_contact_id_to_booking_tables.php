<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add contact_id to reservation_bookings, visa_applications, and ormoc_bookings.
 *
 * This FK enables TIN, address, and business_style to flow automatically into
 * BIR transactions instead of being filled manually by Accounting.
 *
 * Nullable on all three tables — existing rows and walk-in clients have no contact.
 * nullOnDelete() ensures deleting a Contact never hard-blocks a booking record.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reservation_bookings') && ! Schema::hasColumn('reservation_bookings', 'contact_id')) {
            Schema::table('reservation_bookings', function (Blueprint $table) {
                $table->foreignId('contact_id')
                    ->nullable()
                    ->after('corporate_account')
                    ->constrained('contacts')
                    ->nullOnDelete();

                $table->index('contact_id');
            });
        }

        if (Schema::hasTable('visa_applications') && ! Schema::hasColumn('visa_applications', 'contact_id')) {
            Schema::table('visa_applications', function (Blueprint $table) {
                $table->foreignId('contact_id')
                    ->nullable()
                    ->after('agency')
                    ->constrained('contacts')
                    ->nullOnDelete();

                $table->index('contact_id');
            });
        }

        if (Schema::hasTable('ormoc_bookings') && ! Schema::hasColumn('ormoc_bookings', 'contact_id')) {
            Schema::table('ormoc_bookings', function (Blueprint $table) {
                $table->foreignId('contact_id')
                    ->nullable()
                    ->after('email')
                    ->constrained('contacts')
                    ->nullOnDelete();

                $table->index('contact_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('reservation_bookings', 'contact_id')) {
            Schema::table('reservation_bookings', function (Blueprint $table) {
                $table->dropForeign(['contact_id']);
                $table->dropColumn('contact_id');
            });
        }

        if (Schema::hasColumn('visa_applications', 'contact_id')) {
            Schema::table('visa_applications', function (Blueprint $table) {
                $table->dropForeign(['contact_id']);
                $table->dropColumn('contact_id');
            });
        }

        if (Schema::hasColumn('ormoc_bookings', 'contact_id')) {
            Schema::table('ormoc_bookings', function (Blueprint $table) {
                $table->dropForeign(['contact_id']);
                $table->dropColumn('contact_id');
            });
        }
    }
};
