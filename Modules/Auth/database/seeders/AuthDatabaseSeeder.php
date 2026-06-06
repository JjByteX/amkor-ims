<?php

namespace Modules\Auth\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class AuthDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Required by Spatie — clears cached roles/permissions before seeding
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── 1. Branches ───────────────────────────────────────────────────────
        $branches = [
            ['name' => 'QC Main',      'code' => 'QC_MAIN',      'address' => 'Suite 108 West City Plaza Bldg. #66, West Avenue, Quezon City'],
            ['name' => 'Visa Centre',  'code' => 'VISA_CENTRE',  'address' => 'Suite 107 West City Plaza Bldg. #66, West Avenue, Quezon City'],
            ['name' => 'Ormoc Branch', 'code' => 'ORMOC',        'address' => 'Unit 315 Robinsons Place Ormoc, Cogon, Ormoc City, Leyte'],
        ];

        foreach ($branches as $branch) {
            DB::table('branches')->updateOrInsert(
                ['code' => $branch['code']],
                array_merge($branch, ['is_active' => true, 'created_at' => now(), 'updated_at' => now()])
            );
        }

        $qcMain     = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');
        $ormoc      = DB::table('branches')->where('code', 'ORMOC')->value('id');

        // ── 2. Permissions ────────────────────────────────────────────────────
        // Pattern: module.action
        $permissions = [
            // Reservation & Booking
            'reservation.view',
            'reservation.create_inquiry',
            'reservation.confirm_booking',
            'reservation.issue_soa',
            'reservation.issue_po',
            'reservation.escalate_international',
            'reservation.input_sales',
            'reservation.issue_ar',
            'reservation.forward_documents',

            // Visa & Documentation
            'visa.view',
            'visa.create_application',
            'visa.update_status',
            'visa.record_transaction',
            'visa.request_payment',
            'visa.prepare_voucher',
            'visa.audit_voucher',
            'visa.approve',
            'visa.release_cash',
            'visa.pay_embassy',
            'visa.return_or',
            'visa.collect_or',

            // Accounts Receivable
            'ar.view',
            'ar.originate',
            'ar.issue_receipt',
            'ar.submit_documents',
            'ar.check_documents',
            'ar.approve',
            'ar.endorse_disbursement',
            'ar.process_refund',
            'ar.report_audit',

            // Accounts Payable / Disbursement
            'payables.view',
            'payables.request_payment',
            'payables.prepare_voucher',
            'payables.prepare_deposit_slip',
            'payables.record_access_files',
            'payables.send_access_files',
            'payables.audit_voucher',
            'payables.approve',
            'payables.email_proof',
            'payables.generate_report',

            // Disbursement Ledger
            'disbursement.view',
            'disbursement.record',
            'disbursement.audit',
            'disbursement.approve',

            // Cashbond Monitoring
            'cashbond.view',
            'cashbond.check_balances',
            'cashbond.prepare_requisition',
            'cashbond.audit',
            'cashbond.approve',
            'cashbond.deposit',
            'cashbond.update_monitoring',

            // Bills & On-Ques Monitoring
            'bills.view',
            'bills.monitor',
            'bills.prepare_voucher',
            'bills.audit',
            'bills.approve',
            'bills.process_payment',
            'bills.update_monitoring',

            // Credit Card Monitoring
            'creditcard.view',
            'creditcard.monitor',
            'creditcard.prepare_voucher',
            'creditcard.audit',
            'creditcard.approve',
            'creditcard.process_payment',
            'creditcard.update_monitoring',

            // IATA Payments
            'iata.view',
            'iata.prepare_payment',
            'iata.audit',
            'iata.approve',
            'iata.process_payment',

            // BIR / Compliance
            'bir.view',
            'bir.generate_forms',
            'bir.receive_reminders',
            'bir.send_reports',

            // HR & Employee Records
            'hr.view',
            'hr.manage_employees',
            'hr.manage_leave',
            'hr.track_regularization',
            'hr.generate_report',

            // Attendance
            'attendance.view_own',
            'attendance.view_all',
            'attendance.record_own',
            'attendance.edit_all',
            'attendance.generate_report',

            // Marketing
            'marketing.view',
            'marketing.create_material',
            'marketing.submit_material',
            'marketing.approve_material',
            'marketing.publish',
            'marketing.run_campaigns',
            'marketing.monitor_analytics',
            'marketing.send_blasts',
            'marketing.view_expense_report',

            // Sales Summary
            'sales.view_own',
            'sales.view_consolidated',
            'sales.view_progress',
            'sales.set_targets',
            'sales.export',

            // Contacts / Directory
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.delete',

            // Documents
            'documents.view',
            'documents.generate_ar',
            'documents.generate_si',
            'documents.generate_soa',
            'documents.generate_cv',
            'documents.generate_check_voucher',

            // Notifications
            'notifications.view',
            'notifications.receive',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ── 3. Roles + Permission assignments ─────────────────────────────────
        $rolePermissions = [

            'general_manager' => $permissions, // all permissions

            'chief_operations_officer' => [
                'ar.view', 'ar.approve',
                'marketing.view', 'marketing.approve_material', 'marketing.monitor_analytics', 'marketing.view_expense_report',
                'sales.view_own', 'sales.view_consolidated', 'sales.view_progress', 'sales.export',
                'contacts.view',
                'documents.view',
                'notifications.view', 'notifications.receive',
            ],

            'general_sales_manager' => [
                'ar.view', 'ar.approve',
                'sales.view_own', 'sales.view_consolidated', 'sales.view_progress', 'sales.export',
                'contacts.view',
                'documents.view',
                'notifications.view', 'notifications.receive',
            ],

            'accounting_officer' => [
                'reservation.view', 'reservation.issue_soa', 'reservation.issue_ar', 'reservation.forward_documents',
                'ar.view', 'ar.issue_receipt', 'ar.check_documents', 'ar.endorse_disbursement', 'ar.process_refund', 'ar.report_audit',
                'payables.view', 'payables.request_payment', 'payables.prepare_voucher', 'payables.prepare_deposit_slip',
                'disbursement.view', 'disbursement.record',
                'bir.view', 'bir.generate_forms', 'bir.receive_reminders',
                'sales.view_own', 'sales.view_consolidated', 'sales.view_progress', 'sales.export',
                'contacts.view', 'contacts.create', 'contacts.edit',
                'documents.view', 'documents.generate_ar', 'documents.generate_si', 'documents.generate_soa', 'documents.generate_cv', 'documents.generate_check_voucher',
                'notifications.view', 'notifications.receive',
            ],

            'disbursement_officer' => [
                'visa.view', 'visa.prepare_voucher', 'visa.release_cash',
                'payables.view', 'payables.prepare_voucher', 'payables.prepare_deposit_slip', 'payables.record_access_files', 'payables.send_access_files', 'payables.email_proof', 'payables.generate_report',
                'disbursement.view', 'disbursement.record',
                'cashbond.view', 'cashbond.check_balances', 'cashbond.prepare_requisition', 'cashbond.deposit', 'cashbond.update_monitoring',
                'bills.view', 'bills.monitor', 'bills.prepare_voucher', 'bills.process_payment', 'bills.update_monitoring',
                'creditcard.view', 'creditcard.monitor', 'creditcard.prepare_voucher', 'creditcard.process_payment', 'creditcard.update_monitoring',
                'iata.view', 'iata.prepare_payment', 'iata.process_payment',
                'bir.view', 'bir.generate_forms', 'bir.receive_reminders', 'bir.send_reports',
                'contacts.view', 'contacts.create', 'contacts.edit',
                'documents.view', 'documents.generate_cv', 'documents.generate_check_voucher',
                'notifications.view', 'notifications.receive',
            ],

            'admin_auditor' => [
                'reservation.view',
                'visa.view', 'visa.audit_voucher',
                'ar.view', 'ar.process_refund', 'ar.report_audit',
                'payables.view', 'payables.audit_voucher',
                'disbursement.view', 'disbursement.audit',
                'cashbond.view', 'cashbond.audit',
                'bills.view', 'bills.audit',
                'creditcard.view', 'creditcard.audit',
                'iata.view', 'iata.audit',
                'bir.view', 'bir.receive_reminders',
                'hr.view',
                'attendance.view_all',
                'marketing.view',
                'sales.view_own', 'sales.view_consolidated', 'sales.view_progress', 'sales.export',
                'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
                'documents.view',
                'notifications.view', 'notifications.receive',
            ],

            'hr_admin_officer' => [
                'bills.view', 'bills.monitor', 'bills.prepare_voucher', 'bills.process_payment', 'bills.update_monitoring',
                'creditcard.view', 'creditcard.monitor', 'creditcard.prepare_voucher', 'creditcard.process_payment', 'creditcard.update_monitoring',
                'hr.view', 'hr.manage_employees', 'hr.manage_leave', 'hr.track_regularization', 'hr.generate_report',
                'attendance.view_own', 'attendance.view_all', 'attendance.record_own', 'attendance.edit_all', 'attendance.generate_report',
                'contacts.view',
                'notifications.view', 'notifications.receive',
            ],

            'liaison_officer' => [
                'visa.view', 'visa.pay_embassy', 'visa.return_or',
                'contacts.view',
                'attendance.view_own', 'attendance.record_own',
                'notifications.view', 'notifications.receive',
            ],

            'resa_officer' => [
                'reservation.view', 'reservation.create_inquiry', 'reservation.confirm_booking',
                'reservation.issue_soa', 'reservation.issue_po', 'reservation.input_sales', 'reservation.issue_ar', 'reservation.forward_documents',
                'ar.view', 'ar.originate', 'ar.issue_receipt', 'ar.submit_documents',
                'sales.view_own',
                'contacts.view',
                'documents.view', 'documents.generate_ar', 'documents.generate_soa',
                'attendance.view_own', 'attendance.record_own',
                'notifications.view', 'notifications.receive',
            ],

            'ormoc_branch_officer' => [
                'reservation.view', 'reservation.create_inquiry', 'reservation.confirm_booking',
                'reservation.issue_soa', 'reservation.issue_po', 'reservation.escalate_international', 'reservation.input_sales', 'reservation.issue_ar', 'reservation.forward_documents',
                'ar.view', 'ar.originate', 'ar.issue_receipt', 'ar.submit_documents',
                'sales.view_own',
                'contacts.view',
                'documents.view', 'documents.generate_ar', 'documents.generate_soa',
                'attendance.view_own', 'attendance.record_own',
                'notifications.view', 'notifications.receive',
            ],

            'visa_documentation_officer' => [
                'visa.view', 'visa.create_application', 'visa.update_status', 'visa.record_transaction',
                'visa.request_payment', 'visa.collect_or',
                'ar.view', 'ar.originate', 'ar.issue_receipt', 'ar.submit_documents',
                'sales.view_own',
                'contacts.view',
                'documents.view', 'documents.generate_ar', 'documents.generate_soa',
                'attendance.view_own', 'attendance.record_own',
                'notifications.view', 'notifications.receive',
            ],

            'marketing_officer' => [
                'marketing.view', 'marketing.create_material', 'marketing.submit_material',
                'marketing.publish', 'marketing.run_campaigns', 'marketing.monitor_analytics',
                'marketing.send_blasts', 'marketing.view_expense_report',
                'contacts.view',
                'attendance.view_own', 'attendance.record_own',
                'notifications.view', 'notifications.receive',
            ],
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }

        // ── 4. Placeholder users ──────────────────────────────────────────────
        $password = Hash::make('AmkorIMS2026!');

        $users = [
            ['name' => 'JRT',                    'email' => 'jrt@amkor.ph',        'role' => 'general_manager',            'branch_id' => $qcMain],
            ['name' => 'Dalle',                  'email' => 'dalle@amkor.ph',      'role' => 'disbursement_officer',       'branch_id' => $qcMain],
            ['name' => 'Ms. Jhona Ramos',        'email' => 'jhona@amkor.ph',      'role' => 'resa_officer',               'branch_id' => $qcMain],
            ['name' => '[COO]',                  'email' => 'coo@amkor.ph',        'role' => 'chief_operations_officer',   'branch_id' => $qcMain],
            ['name' => '[GSM]',                  'email' => 'gsm@amkor.ph',        'role' => 'general_sales_manager',      'branch_id' => $qcMain],
            ['name' => '[Accounting Officer]',   'email' => 'accounting@amkor.ph', 'role' => 'accounting_officer',         'branch_id' => $qcMain],
            ['name' => '[Admin Auditor]',        'email' => 'auditor@amkor.ph',    'role' => 'admin_auditor',              'branch_id' => $qcMain],
            ['name' => '[HR & Admin Officer]',   'email' => 'hradmin@amkor.ph',    'role' => 'hr_admin_officer',           'branch_id' => $qcMain],
            ['name' => '[Liaison Officer]',      'email' => 'liaison@amkor.ph',    'role' => 'liaison_officer',            'branch_id' => $qcMain],
            ['name' => '[Ormoc Branch Officer]', 'email' => 'ormoc@amkor.ph',      'role' => 'ormoc_branch_officer',       'branch_id' => $ormoc],
            ['name' => '[Visa Officer]',         'email' => 'visa@amkor.ph',       'role' => 'visa_documentation_officer', 'branch_id' => $visaCentre],
            ['name' => '[Marketing Officer]',    'email' => 'marketing@amkor.ph',  'role' => 'marketing_officer',          'branch_id' => $qcMain],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password'             => $password,
                    'is_active'            => true,
                    'must_change_password' => true,
                ])
            );

            $user->syncRoles([$role]);
        }

        // ── 5. Agent codes ────────────────────────────────────────────────────
        $agentCodes = [
            // RESA — Individual sub-group
            ['code' => 'RT',   'department' => 'resa', 'sub_group' => 'individual'],
            ['code' => 'RP',   'department' => 'resa', 'sub_group' => 'individual'],
            ['code' => 'EJ',   'department' => 'resa', 'sub_group' => 'individual'],
            ['code' => 'KG',   'department' => 'resa', 'sub_group' => 'individual'],
            ['code' => 'CM',   'department' => 'resa', 'sub_group' => 'individual'],
            ['code' => 'JR',   'department' => 'resa', 'sub_group' => 'individual'],
            ['code' => 'EB',   'department' => 'resa', 'sub_group' => 'individual'],
            ['code' => 'JF',   'department' => 'resa', 'sub_group' => 'individual'],
            // RESA — Groups sub-group
            ['code' => 'MMT',  'department' => 'resa', 'sub_group' => 'groups'],
            ['code' => 'AL',   'department' => 'resa', 'sub_group' => 'groups'],
            ['code' => 'KL',   'department' => 'resa', 'sub_group' => 'groups'],
            ['code' => 'JMMT', 'department' => 'resa', 'sub_group' => 'groups'],

            // Visa
            ['code' => 'ALEX',  'department' => 'visa', 'sub_group' => null],
            ['code' => 'RICCI', 'department' => 'visa', 'sub_group' => null],
            ['code' => 'MEL',   'department' => 'visa', 'sub_group' => null],
            ['code' => 'KAE',   'department' => 'visa', 'sub_group' => null],
            ['code' => 'MIMI',  'department' => 'visa', 'sub_group' => null],
            ['code' => 'MMT',   'department' => 'visa', 'sub_group' => null],

            // Ormoc
            ['code' => 'AM',  'department' => 'ormoc', 'sub_group' => null],
            ['code' => 'LB',  'department' => 'ormoc', 'sub_group' => null],
            ['code' => 'RD',  'department' => 'ormoc', 'sub_group' => null],
            ['code' => 'KP',  'department' => 'ormoc', 'sub_group' => null],
            ['code' => 'MMT', 'department' => 'ormoc', 'sub_group' => null],
        ];

        foreach ($agentCodes as $code) {
            DB::table('agent_codes')->updateOrInsert(
                ['code' => $code['code'], 'department' => $code['department']],
                array_merge($code, ['is_active' => true, 'created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
