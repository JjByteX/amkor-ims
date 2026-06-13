<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds fields that appear in the client's Employee Details Excel
 * but are missing from the existing employees table.
 *
 * Gaps addressed:
 *  - ID No.                  — employee ID number (distinct from employee_code)
 *  - Nickname                — display name / call name
 *  - Account Number (bank)   — payroll bank account number
 *  - Maturity Date           — end of probationary period
 *  - Last Evaluation Date    — date of last performance review
 *  - VL Fund / Fund Date     — vacation leave fund details
 *  - PhilCare Number         — HMO card number (PhilCare)
 *  - Medicard Number         — alternative HMO (Medicard)
 *  - Company Viber Number    — company-issued Viber contact
 *  - Company Email (Outlook) — separate Outlook/365 address from work_email (Google)
 *  - Uniform records         — migrated from JSON to the new uniform_issuances table
 *                              (uniform_records JSON column kept for backward compat)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {

            // ID No. — the printed employee ID number (e.g. AMK-2024-001)
            // Different from employee_code which is the system identifier
            $table->string('id_number', 50)->nullable()->after('id');

            // Nickname — what the employee is called day-to-day
            $table->string('nickname', 100)->nullable()->after('suffix');

            // Bank account for payroll
            $table->string('bank_account_number', 100)->nullable()->after('tin_number');
            $table->string('bank_name', 100)->nullable()->after('bank_account_number');

            // Probationary / regularization tracking
            $table->date('maturity_date')->nullable()->after('regularization_date');
            $table->date('last_evaluation_date')->nullable()->after('maturity_date');

            // VL Fund — the accumulation pool for vacation leave benefits
            $table->decimal('vl_fund', 10, 2)->nullable()->after('sil_used');
            $table->date('vl_fund_date')->nullable()->after('vl_fund');  // fund start date

            // HMO / health coverage
            $table->string('philcare_number', 100)->nullable()->after('pagibig_number');
            $table->string('medicard_number', 100)->nullable()->after('philcare_number');

            // Company communication accounts
            $table->string('company_viber_number', 50)->nullable()->after('work_email');
            // company_email_outlook — separate from work_email (which may be Google Workspace)
            $table->string('company_email_outlook', 255)->nullable()->after('company_viber_number');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'id_number',
                'nickname',
                'bank_account_number',
                'bank_name',
                'maturity_date',
                'last_evaluation_date',
                'vl_fund',
                'vl_fund_date',
                'philcare_number',
                'medicard_number',
                'company_viber_number',
                'company_email_outlook',
            ]);
        });
    }
};
