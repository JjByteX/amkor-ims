<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drops the stored payables_status column from visa_applications.
 *
 * Reason: payables_status reflects the status of the linked AP Payable record.
 * Storing it creates a sync problem — it goes stale whenever the Payable is
 * updated unless a listener keeps it in sync. Instead, VisaApplication now
 * exposes a getPayablesStatusAttribute() accessor that reads the linked
 * Payable's status live via the visaApplication() relationship on Payable.
 *
 * The accessor returns 'pending' when no linked Payable exists yet.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->dropColumn('payables_status');
        });
    }

    public function down(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->string('payables_status', 30)->nullable()->after('date_received');
        });
    }
};
