<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add agent_code to users.
     *
     * Links a system user account to their sales report agent code so that
     * own-record roles (sales_reservation_officer, sales_ticketing_officer,
     * group_sales_officer, visa_documentation_officer, branch_sales_officer)
     * can be automatically scoped to their own rows in the Sales Summary
     * report without needing a URL filter parameter.
     *
     * A user carries at most one primary agent code. The code must exist
     * in the agent_codes table for the same department. nullable() because
     * manager / finance roles have no agent code.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('agent_code', 10)
                  ->nullable()
                  ->after('branch_id')
                  ->comment('FK → agent_codes.code (same department). Null for non-sales roles.');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('agent_code');
        });
    }
};
