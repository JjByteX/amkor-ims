<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Whether this employee is a sales agent (RESA / Visa / Ormoc)
            $table->boolean('is_agent')->default(false)->after('remarks');

            // Short sales code stamped on bookings and visa applications.
            // Max 5 chars, uppercase, unique, nullable when is_agent = false.
            // Once the code is in use on transactions it becomes read-only
            // (enforced at the application layer, not DB).
            $table->string('agent_code', 5)->nullable()->unique()->after('is_agent');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['is_agent', 'agent_code']);
        });
    }
};
