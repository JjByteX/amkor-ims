<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persist the active branch choice for all-access roles so it survives
 * session resets (logout, timeout, new tab).
 *
 * Only the four all-access roles ever write this column:
 *   president, chief_operating_officer,
 *   finance_admin_supervisor, administrative_assistant
 *
 * All other roles leave it null — their branch is always their own branch_id.
 *
 * On login, HandleInertiaRequests seeds the session from this column.
 * On branch switch, BranchSessionController writes both the session and
 * this column so they always stay in sync.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('active_branch_id')
                ->nullable()
                ->after('branch_id')
                ->constrained('branches')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['active_branch_id']);
            $table->dropColumn('active_branch_id');
        });
    }
};
