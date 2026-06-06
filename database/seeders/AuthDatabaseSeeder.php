<?php

namespace Modules\Auth\Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AuthDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds in order:
     *  1. Branches         (3 branches — QC Main, Visa Centre, Ormoc)
     *  2. Roles            (12 system roles)
     *  3. Permissions      (all module.action permissions from Roles.md)
     *  4. Role → Permission assignments
     *  5. Placeholder users (12 — one per role, force-change on first login)
     *  6. Agent codes      (RESA, Visa, Ormoc groups)
     */
    public function run(): void
    {
        // Spatie caches permissions — clear before seeding so nothing is stale
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── 1. BRANCHES ────────────────────────────────────────────────────────
        $qcMain = Branch::create([
            'name'    => 'QC Main Branch',
            'code'    => 'QC_MAIN',
            'address' => 'Suite 108 West City Plaza Bldg. #66, West Avenue, Quezon City',
        ]);

        $visCentre = Branch::create([
            'name'    => 'Visa Centre',
            'code'    => 'VISA_CENTRE',
            'address' => 'Suite 107 West City Plaza Bldg. #66, West Avenue, Quezon City',
        ]);

        $ormoc = Branch::create([
            'name'    => 'Ormoc Branch',
            'code'    => 'ORMOC',
            'address' => 'Unit 315 Robinsons Place Ormoc, Cogon, Ormoc City, Leyte',
        ]);

        // ── 2. ROLES ───────────────────────────────────────────────────────────
        $roles = [
            'general_manager',
            'chief_operations_officer',
            'general_sales_manager',
            'accounting_officer',
            'disbursement_officer',
            'admin_auditor',
            'hr_admin_officer',
            'liaison_officer',
            'resa_officer',
            'ormoc_branch_officer',
            'visa_documentation_officer',
            'marketing_officer',
        ];

        $createdRoles = [];
        foreach ($roles as $roleName) {
            $createdRoles[$roleName] = Role::create(['name' => $roleName]);
        }

        // ── 3. PERMISSIONS ─────────────────────────────────────────────────────
        // Pattern: module.action
        // Derived from every permission table in Roles.md.
        $permissions = [

            // ── Reservation / Booking ──────────────────────────────────────────
            'reservation.create_inquiry',
            'reservation.view_quotations',
            'reservation.confirm_booking',
            'reservation.issue_soa_po',
            'reservation.escalate_international',
            'reservation.input_monthly_sales',
            'reservation.view_sales_report',
            'reservation.view_sales_report_own',
            'reservation.issue_acknowledgement_receipt',
            'reservation.forward_to_accounting',

            // ── Sales Summary & Progress Report ───────────────────────────────
            'sales.view_own_department',
            'sales.view_consolidated',
            'sales.view_progress_report',
            'sales.set_monthly_target',
            'sales.export',

            // ── Visa & Documentation ──────────────────────────────────────────
            'visa.create_application',
            'visa.update_status',
            'visa.record_transaction',
            'visa.request_payment',
            'visa.prepare_cash_voucher',
            'visa.audit_voucher',
            'visa.final_approval',
            'visa.release_cash',
            'visa.physical_payment',
            'visa.return_or',
            'visa.collect_and_endorse_or',

            // ── Finance – Disbursement / Payables ─────────────────────────────
            'payables.request_payment',
            'payables.prepare_voucher',
            'payables.prepare_deposit_slip',
            'payables.record_access_files',
            'payables.send_access_files',
            'payables.audit_voucher',
            'payables.final_approval',
            'payables.email_proof_of_payment',
            'payables.generate_report',
            'payables.segregate_by_branch',

            // ── Accounts Receivable / Collectibles ────────────────────────────
            'ar.originate_transaction',
            'ar.issue_receipt',
            'ar.submit_documents',
            'ar.check_documents',
            'ar.approve',
            'ar.endorse_to_disbursement',
            'ar.process_refund',
            'ar.report_to_audit',
            'ar.view_own',
            'ar.view_all',

            // ── Cashbond Monitoring ────────────────────────────────────────────
            'cashbond.check_balances',
            'cashbond.prepare_reload_request',
            'cashbond.audit_request',
            'cashbond.final_approval',
            'cashbond.deposit_and_notify',
            'cashbond.update_monitoring',

            // ── Bills & Credit Card Monitoring ────────────────────────────────
            'bills.monitor_due_dates',
            'bills.prepare_voucher',
            'bills.audit',
            'bills.final_approval',
            'bills.process_payment',
            'bills.update_monitoring',

            // ── HR & Attendance ───────────────────────────────────────────────
            'hr.manage_employee',
            'hr.view_all_attendance',
            'hr.generate_attendance_report',
            'hr.manage_leave',
            'hr.track_regularization',
            'attendance.record_own',
            'attendance.view_own',

            // ── Marketing ─────────────────────────────────────────────────────
            'marketing.create_material',
            'marketing.submit_for_review',
            'marketing.review_and_approve',
            'marketing.publish',
            'marketing.create_itinerary',
            'marketing.run_campaigns',
            'marketing.monitor_analytics',
            'marketing.send_email_blasts',
            'marketing.view_expense_report',

            // ── BIR / Compliance ──────────────────────────────────────────────
            'bir.view_transactions',
            'bir.generate_forms',
            'bir.receive_reminders',
            'bir.send_to_external_accounting',
        ];

        foreach ($permissions as $perm) {
            Permission::create(['name' => $perm]);
        }

        // ── 4. ROLE → PERMISSION ASSIGNMENTS ──────────────────────────────────

        // General Manager (JRT) — all permissions
        $createdRoles['general_manager']->givePermissionTo(Permission::all());

        // Chief Operations Officer — AR + marketing
        $createdRoles['chief_operations_officer']->givePermissionTo([
            'reservation.view_quotations',
            'reservation.view_sales_report',
            'ar.approve',
            'ar.view_all',
            'ar.process_refund',
            'sales.view_own_department',
            'sales.view_consolidated',
            'sales.view_progress_report',
            'sales.export',
            'marketing.review_and_approve',
            'marketing.monitor_analytics',
            'marketing.view_expense_report',
        ]);

        // General Sales Manager — AR only
        $createdRoles['general_sales_manager']->givePermissionTo([
            'reservation.view_quotations',
            'reservation.view_sales_report',
            'ar.approve',
            'ar.view_all',
            'sales.view_own_department',
            'sales.view_consolidated',
            'sales.view_progress_report',
            'sales.export',
        ]);

        // Accounting Officer — finance and AR
        $createdRoles['accounting_officer']->givePermissionTo([
            'reservation.view_quotations',
            'reservation.issue_soa_po',
            'reservation.view_sales_report',
            'reservation.issue_acknowledgement_receipt',
            'reservation.forward_to_accounting',
            'ar.issue_receipt',
            'ar.submit_documents',
            'ar.check_documents',
            'ar.endorse_to_disbursement',
            'ar.process_refund',
            'ar.report_to_audit',
            'ar.view_all',
            'payables.request_payment',
            'payables.prepare_voucher',
            'payables.prepare_deposit_slip',
            'sales.view_own_department',
            'sales.view_consolidated',
            'sales.view_progress_report',
            'sales.export',
            'bir.view_transactions',
            'bir.generate_forms',
            'bir.receive_reminders',
        ]);

        // Disbursement Officer (Dalle) — disbursement and payables
        $createdRoles['disbursement_officer']->givePermissionTo([
            'visa.prepare_cash_voucher',
            'visa.release_cash',
            'payables.prepare_voucher',
            'payables.prepare_deposit_slip',
            'payables.record_access_files',
            'payables.send_access_files',
            'payables.email_proof_of_payment',
            'payables.generate_report',
            'payables.segregate_by_branch',
            'cashbond.check_balances',
            'cashbond.prepare_reload_request',
            'cashbond.deposit_and_notify',
            'cashbond.update_monitoring',
            'bills.monitor_due_dates',
            'bills.prepare_voucher',
            'bills.process_payment',
            'bills.update_monitoring',
            'bir.view_transactions',
            'bir.generate_forms',
            'bir.receive_reminders',
            'bir.send_to_external_accounting',
        ]);

        // Admin Auditor — audit view only across all modules
        $createdRoles['admin_auditor']->givePermissionTo([
            'reservation.view_quotations',
            'reservation.view_sales_report',
            'visa.audit_voucher',
            'payables.audit_voucher',
            'ar.process_refund',
            'ar.report_to_audit',
            'ar.view_all',
            'cashbond.audit_request',
            'bills.audit',
            'sales.view_own_department',
            'sales.view_consolidated',
            'sales.view_progress_report',
            'sales.export',
            'bir.view_transactions',
            'bir.receive_reminders',
        ]);

        // HR & Admin Officer — HR, attendance, bills
        $createdRoles['hr_admin_officer']->givePermissionTo([
            'hr.manage_employee',
            'hr.view_all_attendance',
            'hr.generate_attendance_report',
            'hr.manage_leave',
            'hr.track_regularization',
            'bills.monitor_due_dates',
            'bills.prepare_voucher',
            'bills.process_payment',
            'bills.update_monitoring',
            'attendance.record_own',
            'attendance.view_own',
        ]);

        // Liaison Officer — task-based, no reporting
        $createdRoles['liaison_officer']->givePermissionTo([
            'visa.physical_payment',
            'visa.return_or',
        ]);

        // RESA Officer (Ms. Jhona Ramos + others) — head office records only
        $createdRoles['resa_officer']->givePermissionTo([
            'reservation.create_inquiry',
            'reservation.view_quotations',
            'reservation.confirm_booking',
            'reservation.issue_soa_po',
            'reservation.input_monthly_sales',
            'reservation.view_sales_report_own',
            'reservation.issue_acknowledgement_receipt',
            'reservation.forward_to_accounting',
            'ar.originate_transaction',
            'ar.issue_receipt',
            'ar.submit_documents',
            'ar.view_own',
            'sales.view_own_department',
        ]);

        // Ormoc Branch Officer — Ormoc records only
        $createdRoles['ormoc_branch_officer']->givePermissionTo([
            'reservation.create_inquiry',
            'reservation.view_quotations',
            'reservation.confirm_booking',
            'reservation.issue_soa_po',
            'reservation.escalate_international',
            'reservation.input_monthly_sales',
            'reservation.view_sales_report_own',
            'reservation.issue_acknowledgement_receipt',
            'reservation.forward_to_accounting',
            'ar.originate_transaction',
            'ar.issue_receipt',
            'ar.submit_documents',
            'ar.view_own',
            'sales.view_own_department',
        ]);

        // Visa & Documentation Officer — visa records only
        $createdRoles['visa_documentation_officer']->givePermissionTo([
            'visa.create_application',
            'visa.update_status',
            'visa.record_transaction',
            'visa.request_payment',
            'visa.collect_and_endorse_or',
            'ar.originate_transaction',
            'ar.issue_receipt',
            'ar.submit_documents',
            'ar.view_own',
            'sales.view_own_department',
        ]);

        // Marketing Officer — marketing module only
        $createdRoles['marketing_officer']->givePermissionTo([
            'marketing.create_material',
            'marketing.submit_for_review',
            'marketing.publish',
            'marketing.create_itinerary',
            'marketing.run_campaigns',
            'marketing.monitor_analytics',
            'marketing.send_email_blasts',
            'marketing.view_expense_report',
        ]);

        // ── 5. PLACEHOLDER USERS ──────────────────────────────────────────────
        // All use AmkorIMS2026! — must_change_password = true forces reset on first login.
        // Real names and emails for COO, GSM, Admin Auditor are pending (OQ-1, OQ-2, OQ-3).
        $defaultPassword = Hash::make('AmkorIMS2026!');

        $users = [
            [
                'name'                  => 'JRT',
                'email'                 => 'jrt@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'general_manager',
                'must_change_password'  => false,  // Owner — no force-reset
            ],
            [
                'name'                  => 'Chief Operations Officer',
                'email'                 => 'coo@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'chief_operations_officer',
                'must_change_password'  => true,   // Placeholder — update name when OQ-2 resolved
            ],
            [
                'name'                  => 'General Sales Manager',
                'email'                 => 'gsm@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'general_sales_manager',
                'must_change_password'  => true,   // Placeholder — update name when OQ-3 resolved
            ],
            [
                'name'                  => 'Accounting Officer',
                'email'                 => 'accounting@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'accounting_officer',
                'must_change_password'  => true,
            ],
            [
                'name'                  => 'Dalle',
                'email'                 => 'dalle@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'disbursement_officer',
                'must_change_password'  => true,
            ],
            [
                'name'                  => 'Admin Auditor',
                'email'                 => 'auditor@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'admin_auditor',
                'must_change_password'  => true,   // Placeholder — update name when OQ-1 resolved
            ],
            [
                'name'                  => 'HR & Admin Officer',
                'email'                 => 'hradmin@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'hr_admin_officer',
                'must_change_password'  => true,
            ],
            [
                'name'                  => 'Liaison Officer',
                'email'                 => 'liaison@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'liaison_officer',
                'must_change_password'  => true,
            ],
            [
                'name'                  => 'Ms. Jhona Ramos',
                'email'                 => 'jhona@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'resa_officer',
                'must_change_password'  => true,
            ],
            [
                'name'                  => 'Ormoc Branch Officer',
                'email'                 => 'ormoc@amkor.ph',
                'branch_id'             => $ormoc->id,
                'role'                  => 'ormoc_branch_officer',
                'must_change_password'  => true,
            ],
            [
                'name'                  => 'Visa & Documentation Officer',
                'email'                 => 'visa@amkor.ph',
                'branch_id'             => $visCentre->id,
                'role'                  => 'visa_documentation_officer',
                'must_change_password'  => true,
            ],
            [
                'name'                  => 'Marketing Officer',
                'email'                 => 'marketing@amkor.ph',
                'branch_id'             => $qcMain->id,
                'role'                  => 'marketing_officer',
                'must_change_password'  => true,
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::create([
                ...$userData,
                'password'              => $defaultPassword,
                'email_verified_at'     => now(),
            ]);

            $user->assignRole($role);
        }

        // ── 6. AGENT CODES ────────────────────────────────────────────────────
        // RESA sub-groups: Individual and Groups
        $resaIndividual = ['RT', 'RP', 'EJ', 'KG', 'CM', 'JR', 'EB', 'JF'];
        $resaGroups     = ['MMT', 'AL', 'KL'];
        $jmmt           = ['JMMT']; // sole JMMT code — sub_group: individual per brief context

        foreach ($resaIndividual as $code) {
            DB::table('agent_codes')->insert([
                'code'        => $code,
                'department'  => 'resa',
                'sub_group'   => 'individual',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        foreach ($resaGroups as $code) {
            DB::table('agent_codes')->insert([
                'code'        => $code,
                'department'  => 'resa',
                'sub_group'   => 'groups',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        foreach ($jmmt as $code) {
            DB::table('agent_codes')->insert([
                'code'        => $code,
                'department'  => 'resa',
                'sub_group'   => 'individual',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // Visa agent codes (MMT also appears here — different department row)
        $visaCodes = ['ALEX', 'RICCI', 'MEL', 'KAE', 'MIMI', 'MMT'];
        foreach ($visaCodes as $code) {
            DB::table('agent_codes')->insert([
                'code'        => $code,
                'department'  => 'visa',
                'sub_group'   => null,
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // Ormoc agent codes (MMT also appears here — different department row)
        $ormocCodes = ['AM', 'LB', 'RD', 'KP', 'MMT'];
        foreach ($ormocCodes as $code) {
            DB::table('agent_codes')->insert([
                'code'        => $code,
                'department'  => 'ormoc',
                'sub_group'   => null,
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }
}