<?php

namespace Modules\Auth\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AuthDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Required by Spatie — clears cached roles/permissions before seeding
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── 1. Branches ───────────────────────────────────────────────────────
        // Amkor Travel & Tours has exactly two physical branches.
        // The Visa & Documentation desk operates from QC Main — not a separate branch.
        $branches = [
            ['name' => 'QC Main',      'code' => 'QC_MAIN', 'address' => 'Suite 108 West City Plaza Bldg. #66, West Avenue, Quezon City'],
            ['name' => 'Ormoc Branch', 'code' => 'ORMOC',   'address' => 'Unit 315 Robinsons Place Ormoc, Cogon, Ormoc City, Leyte'],
        ];

        foreach ($branches as $branch) {
            DB::table('branches')->updateOrInsert(
                ['code' => $branch['code']],
                array_merge($branch, ['is_active' => true, 'created_at' => now(), 'updated_at' => now()])
            );
        }

        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $ormoc  = DB::table('branches')->where('code', 'ORMOC')->value('id');

        // ── 2. Permissions ────────────────────────────────────────────────────
        // Pattern: module.action
        // Scoped access (own-only, branch-only) is enforced at the controller
        // level — the permission grants entry, scope narrows what is shown.
        $permissions = [
            // Module 1 — Reservation & Booking (QC)
            'reservation.view',
            'reservation.create',
            'reservation.update',
            'reservation.delete',           // president only
            'reservation.forward_accounting',
            'reservation.view_sales_report', // full report (managers+)
            'reservation.view_own_sales',    // own-agent summary only
            'reservation.approve',          // Gap 5 — branch_supervisor approval before forwarding (was ormoc.approve)
            'reservation.escalate',         // Gap 5 — escalate to sales_ticketing_officer (was ormoc.escalate)

            // Module 2 — Ormoc Branch (REMOVED — module disabled after merge)
            // ormoc.* permissions dropped; branch_supervisor and branch_sales_officer
            // now use reservation.* permissions to access unified reservation_bookings.
            // Any existing ormoc.* rows in the DB are harmless no-ops (no route checks them).

            // Module 3 — Visa & Documentation
            'visa.view',
            'visa.create',
            'visa.update',
            'visa.delete',                   // president only
            'visa.update_status',
            'visa.request_payment',
            'visa.record_or',
            'visa.endorse_or',
            'visa.pay_embassy',              // liaison_officer_visa only

            // Module 4 — Accounts Receivable / Collectibles
            'ar.view',
            'ar.create',
            'ar.update',
            'ar.delete',                     // president only
            'ar.approve_coo',
            'ar.approve_gsm',
            'ar.endorse_disbursement',
            'ar.process_refund',
            'ar.view_own',                   // own bookings' AR status only

            // Module 5 — Accounts Payable / Payables to Operators
            'payables.view',
            'payables.create',
            'payables.update',
            'payables.delete',               // president only
            'payables.check',                // administrative_assistant audit step
            'payables.approve',              // president final approval
            'payables.release',
            'payables.view_assigned',        // liaison officers — read assigned payable only

            // Module 6 — Disbursement
            'disbursement.view',
            'disbursement.create',
            'disbursement.update',
            'disbursement.delete',           // president only
            'disbursement.check',            // administrative_assistant audit step
            'disbursement.approve',          // president final approval
            'disbursement.release',          // liaison_officer_finance marks executed
            'disbursement.export_access_file',

            // Module 7 — Bills & On-Ques Monitoring
            'bills.view',
            'bills.create',
            'bills.update',
            'bills.delete',                  // president only
            'bills.check',
            'bills.approve',
            'bills.mark_paid',               // liaison_officer_finance marks paid

            // Module 8 — Cashbond Monitoring
            'cashbond.view',
            'cashbond.view_readonly',        // sales roles: portal balances only
            'cashbond.create',
            'cashbond.update',
            'cashbond.delete',               // president only
            'cashbond.check',
            'cashbond.approve',
            'cashbond.deposit',              // liaison_officer_finance executes deposit

            // Module 9 — Credit Card Monitoring
            'creditcard.view',
            'creditcard.create',
            'creditcard.update',
            'creditcard.delete',             // president only
            'creditcard.check',
            'creditcard.approve',
            'creditcard.release',

            // Module 10 — IATA Payments
            'iata.view',
            'iata.create',
            'iata.update',
            'iata.delete',                   // president only
            'iata.check',
            'iata.approve',
            'iata.mark_deposited',           // liaison_officer_finance marks deposited + emails

            // Module 11 — BIR Compliance
            'bir.view',
            'bir.create',
            'bir.update',
            'bir.delete',                    // president only
            'bir.export',                    // finance_admin_supervisor exports to external accountant
            'bir.audit',                     // administrative_assistant audit remarks

            // Module 12 — Sales Summary Report
            'sales.view_all',                // all branches + departments
            'sales.view_dept',               // own department only
            'sales.view_own',                // own agent summary only
            'sales.view_branch',             // own branch summary only
            'sales.set_targets',
            'sales.export',

            // Module 13 — Marketing
            'marketing.view',
            'marketing.view_itinerary',      // view published itineraries only
            'marketing.view_expenses',       // accounting: expenses view only
            'marketing.create',
            'marketing.update_own',          // sales_marketing_officer: own materials only
            'marketing.update',              // business_development_manager: all materials
            'marketing.delete',              // president only
            'marketing.approve',             // chief_operating_officer approves before publish
            'marketing.publish',
            'marketing.run_campaigns',
            'marketing.send_blasts',

            // Module 14 — HR & Employee Records
            'hr.view',                       // finance_admin_supervisor, administrative_assistant
            'hr.view_own',                   // all other staff: own record only
            'hr.create',
            'hr.update',
            'hr.delete',                     // president only

            // Module 15 — Attendance
            'attendance.view_all',           // finance_admin_supervisor, administrative_assistant, president, coo
            'attendance.view_team',          // supervisors/managers: own team
            'attendance.view_own',           // all staff: own record
            'attendance.record',             // clock-in / clock-out (all)
            'attendance.edit_all',           // finance_admin_supervisor, coo, president
            'attendance.edit_team',          // supervisors: own team
            'attendance.delete',             // president only
            'attendance.report',

            // Module 16 — Contacts / Directory
            'contacts.view',
            'contacts.create',
            'contacts.update',
            'contacts.update_own',           // operational officers: own entries only
            'contacts.delete',               // president only

            // Module 17 — Notifications
            'notifications.view',
            'notifications.receive',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ── 3. Roles + Permission assignments ─────────────────────────────────
        //
        // Roles defined in the Roles & Permissions Matrix:
        //   1  president                     (Jojit R. Tismo)
        //   2  chief_operating_officer       (Marianne M. Tismo)
        //   3  finance_admin_supervisor      (John Vic Galendez)
        //   4  administrative_assistant      (Judy Ann Gregorio — also Admin Auditor)
        //   5  accounting_assistant          (Kristia Borbe, Zarah Padecio, Ashly Ayag)
        //   6  liaison_officer_finance       (Dialectica Baguio, Mark Lagahit)
        //   7  general_sales_manager         (Rochelle Tienzo)
        //   8  sales_reservation_officer     (Elaiza Joaquin, Christine Mateo, etc.)
        //   9  sales_ticketing_officer       (Jhonalyn Ramos — OIC)
        //  10  group_sales_officer           (Angela Lo, Kyla Luna)
        //  11  business_development_manager  (Jhoanna Marie Tismo)
        //  12  sales_marketing_officer       (Mitzi Vidor, Jahara Ramirez)
        //  13  visa_documentation_supervisor (Maria Alexandria De Quiros)
        //  14  liaison_officer_visa          (Randy Callueng)
        //  15  visa_documentation_officer    (Ricci Joy Alcaraz, Joanne May Evasco)
        //  16  branch_supervisor             (Anjelly Miroy)
        //  17  branch_sales_officer          (Louie Bacalso, Rhea Dedace, Kay Parrilla)

        $rolePermissions = [

            // ── 1. President — all permissions ───────────────────────────────
            'president' => $permissions,

            // ── 2. Chief Operating Officer ────────────────────────────────────
            // Modules: 1✅ 2✅ 3👁 4✏️ 5👁 6👁 7👁 8👁 9👁 10👁 11👁 12✅ 13✏️ 14👁 15✅ 16👁 17🔒
            'chief_operating_officer' => [
                // Module 1 — Reservation (full CRU, no delete)
                'reservation.view', 'reservation.create', 'reservation.update',
                'reservation.forward_accounting', 'reservation.view_sales_report',
                // Module 2 — Ormoc (module disabled; reservation.* permissions cover Ormoc bookings)
                // Module 3 — Visa (view only)
                'visa.view',
                // Module 4 — AR (approve + CRU, no delete)
                'ar.view', 'ar.update', 'ar.approve_coo', 'ar.endorse_disbursement', 'ar.process_refund',
                // Module 5 — Payables (view only)
                'payables.view',
                // Module 6 — Disbursement (view only)
                'disbursement.view',
                // Module 7 — Bills (view only)
                'bills.view',
                // Module 8 — Cashbond (view only)
                'cashbond.view',
                // Module 9 — Credit Card (view only)
                'creditcard.view',
                // Module 10 — IATA (view only)
                'iata.view',
                // Module 11 — BIR (view only)
                'bir.view',
                // Module 12 — Sales Summary (all branches + depts)
                'sales.view_all', 'sales.export',
                // Module 13 — Marketing (reviews + approves; publish is triggered after approval, not by COO directly)
                'marketing.view', 'marketing.approve',
                // Module 14 — HR (view only)
                'hr.view',
                // Module 15 — Attendance (view all, edit all)
                'attendance.view_all', 'attendance.view_own', 'attendance.record',
                'attendance.edit_all', 'attendance.report',
                // Module 16 — Contacts (view only)
                'contacts.view',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 3. Finance & Admin Supervisor ─────────────────────────────────
            // Oversight role across all financial modules; dept head of Finance & Admin.
            // Modules: 1👁✏️ 2👁✏️ 3👁 4✏️ 5✏️ 6✏️ 7✏️ 8✏️ 9✏️ 10✏️ 11👁 12✅ 13🚫 14✅ 15✅ 16👁 17🔒
            'finance_admin_supervisor' => [
                // Module 1 — Reservation (view + annotate)
                'reservation.view', 'reservation.update',
                'reservation.forward_accounting', 'reservation.view_sales_report',
                // Module 2 — Ormoc (module disabled; reservation.* permissions cover Ormoc bookings)
                // Module 3 — Visa (view only)
                'visa.view',
                // Module 4 — AR (annotate / oversight)
                'ar.view', 'ar.update',
                // Module 5 — Payables (annotate before JRT approval)
                'payables.view', 'payables.update',
                // Module 6 — Disbursement (annotate)
                'disbursement.view', 'disbursement.update',
                // Module 7 — Bills (annotate)
                'bills.view', 'bills.update',
                // Module 8 — Cashbond (annotate; approves reload requests)
                'cashbond.view', 'cashbond.update', 'cashbond.approve',
                // Module 9 — Credit Card (annotate)
                'creditcard.view', 'creditcard.update',
                // Module 10 — IATA (annotate)
                'iata.view', 'iata.update',
                // Module 11 — BIR (view + export to external accountant)
                'bir.view', 'bir.export',
                // Module 12 — Sales Summary (all)
                'sales.view_all', 'sales.export',
                // Module 14 — HR (primary owner: full CRU, no delete)
                'hr.view', 'hr.create', 'hr.update',
                // Module 15 — Attendance (primary owner of all attendance)
                'attendance.view_all', 'attendance.view_own', 'attendance.record',
                'attendance.edit_all', 'attendance.report',
                // Module 16 — Contacts (view only)
                'contacts.view',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 4. Administrative Assistant (Admin Auditor) ───────────────────
            // Judy Ann Gregorio — holds both the Admin Assistant title and the
            // audit function. Receives transaction copies; adds audit remarks.
            // Modules: 1✏️ 2✏️ 3✏️ 4✏️ 5✏️ 6✏️ 7✏️ 8✏️ 9✏️ 10✏️ 11✏️ 12🚫 13🚫 14✏️ 15✅ 16👁 17🔒
            'administrative_assistant' => [
                // Module 1 — Reservation (audit remarks only)
                'reservation.view', 'reservation.update',
                // Module 2 — Ormoc (module disabled; reservation.view/update covers Ormoc bookings)
                // Module 3 — Visa (audit remarks; receives endorsed documents)
                'visa.view', 'visa.update',
                // Module 4 — AR (audit remarks; receives AR report copy)
                'ar.view', 'ar.update',
                // Module 5 — Payables (audit check step before JRT)
                'payables.view', 'payables.check',
                // Module 6 — Disbursement (receives access files; adds audit remarks)
                'disbursement.view', 'disbursement.check', 'disbursement.export_access_file',
                // Module 7 — Bills (checks voucher)
                'bills.view', 'bills.check',
                // Module 8 — Cashbond (checks reload request)
                'cashbond.view', 'cashbond.check',
                // Module 9 — Credit Card (checks voucher)
                'creditcard.view', 'creditcard.check',
                // Module 10 — IATA (checks before JRT approval)
                'iata.view', 'iata.check',
                // Module 11 — BIR (reviews entries for audit)
                'bir.view', 'bir.audit',
                // Module 14 — HR (assists finance_admin_supervisor; uniform issuance)
                'hr.view', 'hr.update',
                // Module 15 — Attendance (logs own; reads all for payroll support)
                'attendance.view_all', 'attendance.view_own', 'attendance.record',
                'attendance.edit_team', 'attendance.report',
                // Module 16 — Contacts (view only)
                'contacts.view',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 5. Accounting Assistant ────────────────────────────────────────
            // Primary owner of financial modules: AR, Payables, Disbursement,
            // Bills, Cashbond, Credit Cards, IATA, BIR.
            // Modules: 1✏️ 2✏️ 3✏️ 4✅ 5✅ 6✅ 7✅ 8✅ 9✅ 10✅ 11✅ 12✅ 13👁expenses 14🔒 15🔒 16👁 17🔒
            'accounting_assistant' => [
                // Module 1 — Reservation (records payment, updates AR/OR/SI)
                'reservation.view', 'reservation.update',
                // Module 2 — Ormoc (module disabled; reservation.view/update covers Ormoc bookings)
                // Module 3 — Visa (records OR; payment matching; prepares cash/voucher)
                'visa.view', 'visa.update', 'visa.record_or',
                // Module 4 — AR (primary owner: full CRU)
                'ar.view', 'ar.create', 'ar.update',
                'ar.endorse_disbursement', 'ar.process_refund',
                // Module 5 — Payables (primary owner: prepares voucher, cheque, deposit slip)
                'payables.view', 'payables.create', 'payables.update', 'payables.release',
                // Module 6 — Disbursement (primary owner: all cash/check vouchers)
                'disbursement.view', 'disbursement.create', 'disbursement.update',
                'disbursement.release', 'disbursement.export_access_file',
                // Module 7 — Bills (primary owner)
                'bills.view', 'bills.create', 'bills.update', 'bills.mark_paid',
                // Module 8 — Cashbond (monitors balances; prepares reload requests)
                'cashbond.view', 'cashbond.create', 'cashbond.update', 'cashbond.deposit',
                // Module 9 — Credit Card (primary owner)
                'creditcard.view', 'creditcard.create', 'creditcard.update',
                // Module 10 — IATA (primary owner)
                'iata.view', 'iata.create', 'iata.update', 'iata.mark_deposited',
                // Module 11 — BIR (creates SI/AR; manages VAT breakdown)
                'bir.view', 'bir.create', 'bir.update', 'bir.export',
                // Module 12 — Sales Summary (all departments for reconciliation)
                'sales.view_all', 'sales.export',
                // Module 13 — Marketing (expenses view only)
                'marketing.view_expenses',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (view; needs TIN and bank details)
                'contacts.view',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 6. Liaison Officer (Finance) ───────────────────────────────────
            // Dialectica Baguio, Mark Lagahit — executes physical payments,
            // deposits, and purchases assigned by accounting.
            // Modules: 1🚫 2🚫 3🚫 4🚫 5👁 6👁✏️ 7👁✏️ 8👁✏️ 9🚫 10👁✏️ 11🚫 12🚫 13🚫 14🔒 15🔒 16👁 17🔒
            'liaison_officer_finance' => [
                // Module 5 — Payables (reads assigned payable)
                'payables.view_assigned',
                // Module 6 — Disbursement (reads voucher; marks executed)
                'disbursement.view', 'disbursement.release',
                // Module 7 — Bills (marks paid after payment execution)
                'bills.view', 'bills.mark_paid',
                // Module 8 — Cashbond (executes deposit; marks as reloaded)
                'cashbond.view_readonly', 'cashbond.deposit',
                // Module 10 — IATA (marks deposited; emails operator with deposit slip)
                'iata.view', 'iata.mark_deposited',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (needs supplier/bank details)
                'contacts.view',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 7. General Sales Manager ───────────────────────────────────────
            // Rochelle Tienzo — approves AR flow alongside COO; oversees all sales.
            // Modules: 1✅ 2✅ 3👁 4✏️ 5👁 6🚫 7🚫 8👁 9🚫 10👁 11👁 12✅ 13👁 14🚫 15🌿 16✅ 17🔒
            'general_sales_manager' => [
                // Module 1 — Reservation (full CRU, no delete)
                'reservation.view', 'reservation.create', 'reservation.update',
                'reservation.forward_accounting', 'reservation.view_sales_report',
                // Module 2 — Ormoc (module disabled; reservation.* permissions cover Ormoc bookings)
                // Module 3 — Visa (view only)
                'visa.view',
                // Module 4 — AR (approves AR flow)
                'ar.view', 'ar.update', 'ar.approve_gsm',
                // Module 5 — Payables (view only)
                'payables.view',
                // Module 8 — Cashbond (view only — portal balance visibility for sales ops)
                'cashbond.view',
                // Module 10 — IATA (view only)
                'iata.view',
                // Module 11 — BIR (view only)
                'bir.view',
                // Module 12 — Sales Summary (all branches + departments)
                'sales.view_all', 'sales.set_targets', 'sales.export',
                // Module 13 — Marketing (view itineraries; receives for distribution)
                'marketing.view', 'marketing.view_itinerary',
                // Module 15 — Attendance (own + QC Sales team)
                'attendance.view_team', 'attendance.view_own', 'attendance.record',
                'attendance.edit_team', 'attendance.report',
                // Module 16 — Contacts (manages corporate + sub-agent contacts)
                'contacts.view', 'contacts.create', 'contacts.update',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 8. Sales & Reservation Officer ────────────────────────────────
            // Own bookings only (🔒). Cannot see peer records.
            // Modules: 1🔒 2🚫 3🚫 4🔒 5🚫 6🚫 7🚫 8👁 9🚫 10🚫 11🚫 12🔒 13👁 14🔒 15🔒 16✏️ 17🔒
            'sales_reservation_officer' => [
                // Module 1 — Reservation (own bookings only)
                'reservation.view', 'reservation.create', 'reservation.update',
                'reservation.forward_accounting', 'reservation.view_own_sales',
                // Module 4 — AR (own bookings' AR status only)
                'ar.view_own',
                // Module 8 — Cashbond (read-only — portal balances before finalizing)
                'cashbond.view_readonly',
                // Module 12 — Sales Summary (own agent summary only)
                'sales.view_own',
                // Module 13 — Marketing (view published itineraries only)
                'marketing.view_itinerary',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (creates client contacts; edits own entries)
                'contacts.view', 'contacts.create', 'contacts.update_own',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 9. Sales & Ticketing Officer (OIC) ────────────────────────────
            // Jhonalyn Ramos — OIC; escalation point for Ormoc international bookings.
            // Has override access to escalated Ormoc records (scoped, not full branch).
            // Modules: 1🔒 2✏️(escalated only) 3🚫 4🔒 5🚫 6🚫 7🚫 8👁 9🚫 10🚫 11🚫 12🔒 13👁 14🔒 15🔒 16✏️ 17🔒
            'sales_ticketing_officer' => [
                // Module 1 — Reservation (own bookings; handles Ormoc escalations)
                'reservation.view', 'reservation.create', 'reservation.update',
                'reservation.forward_accounting', 'reservation.view_own_sales',
                // Module 2 — Ormoc (module disabled; reservation.* handles escalated Ormoc records)
                // Module 4 — AR (own bookings' AR status only)
                'ar.view_own',
                // Module 8 — Cashbond (read-only — portal balances for booking + Ormoc escalations)
                'cashbond.view_readonly',
                // Module 12 — Sales Summary (own agent summary only)
                'sales.view_own',
                // Module 13 — Marketing (view published itineraries only)
                'marketing.view_itinerary',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (creates client contacts; edits own entries)
                'contacts.view', 'contacts.create', 'contacts.update_own',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 10. Group Sales Officer ────────────────────────────────────────
            // Angela Lo, Kyla Luna — own bookings only; corporate/group contacts.
            // Modules: 1🔒 2🚫 3🚫 4🔒 5🚫 6🚫 7🚫 8👁 9🚫 10🚫 11🚫 12🔒 13👁 14🔒 15🔒 16✏️ 17🔒
            'group_sales_officer' => [
                // Module 1 — Reservation (own bookings only)
                'reservation.view', 'reservation.create', 'reservation.update',
                'reservation.forward_accounting', 'reservation.view_own_sales',
                // Module 4 — AR (own bookings' AR status only)
                'ar.view_own',
                // Module 8 — Cashbond (read-only — portal balances before booking)
                'cashbond.view_readonly',
                // Module 12 — Sales Summary (own agent summary only)
                'sales.view_own',
                // Module 13 — Marketing (view published itineraries only)
                'marketing.view_itinerary',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (creates corporate/group contacts; edits own)
                'contacts.view', 'contacts.create', 'contacts.update_own',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 11. Business Development Manager ──────────────────────────────
            // Jhoanna Marie Tismo — oversees Marketing team + Business Dev contacts.
            // Modules: 1👁 2👁 3👁 4👁 5🚫 6🚫 7🚫 8🚫 9🚫 10🚫 11🚫 12✏️(BD+Visa) 13✅ 14🚫 15🌿 16✅ 17🔒
            'business_development_manager' => [
                // Module 1 — Reservation (view only — cross-dept reporting; reservation.view
                // already covers Ormoc bookings post-merge, so no separate Ormoc grant needed)
                'reservation.view', 'reservation.view_sales_report',
                // Module 3 — Visa (view only)
                'visa.view',
                // Module 4 — AR (view only)
                'ar.view',
                // Module 12 — Sales Summary (BD + Visa departments only)
                'sales.view_dept', 'sales.export',
                // Module 13 — Marketing (dept head: full CRU, no delete)
                'marketing.view', 'marketing.create', 'marketing.update',
                'marketing.run_campaigns', 'marketing.send_blasts',
                'marketing.publish',
                // Module 15 — Attendance (own + BD/Marketing team)
                'attendance.view_team', 'attendance.view_own', 'attendance.record',
                'attendance.edit_team', 'attendance.report',
                // Module 16 — Contacts (manages BD contacts)
                'contacts.view', 'contacts.create', 'contacts.update',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 12. Sales & Marketing Officer ─────────────────────────────────
            // Mitzi Vidor, Jahara Ramirez — creates campaigns; edits own materials only.
            // Modules: 1🚫 2🚫 3🚫 4🚫 5🚫 6🚫 7🚫 8🚫 9🚫 10🚫 11🚫 12🚫 13🔒 14🔒 15🔒 16👁 17🔒
            'sales_marketing_officer' => [
                // Module 13 — Marketing (creates campaigns; edits own materials only)
                'marketing.view', 'marketing.create', 'marketing.update_own',
                'marketing.run_campaigns', 'marketing.send_blasts',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (view only)
                'contacts.view',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 13. Visa & Documentation Supervisor ───────────────────────────
            // Maria Alexandria De Quiros — full Visa access; can override any officer's record.
            // Modules: 1🚫 2🚫 3✅ 4👁(own dept) 5👁 6🚫 7🚫 8🚫 9🚫 10🚫 11🚫 12✅(Visa dept) 13👁 14🔒 15🌿 16✅ 17🔒
            'visa_documentation_supervisor' => [
                // Module 3 — Visa (full CRU, no delete; can override any officer)
                'visa.view', 'visa.create', 'visa.update',
                'visa.update_status', 'visa.request_payment', 'visa.record_or', 'visa.endorse_or',
                // Module 4 — AR (own dept collectibles only)
                'ar.view_own',
                // Module 5 — Payables (reads Visa-originated payables only)
                'payables.view_assigned',
                // Module 12 — Sales Summary (Visa department only)
                'sales.view_dept',
                // Module 13 — Marketing (view published itineraries only)
                'marketing.view_itinerary',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own + Visa & Documentation team)
                'attendance.view_team', 'attendance.view_own', 'attendance.record',
                'attendance.edit_team', 'attendance.report',
                // Module 16 — Contacts (manages embassy + visa supplier contacts)
                'contacts.view', 'contacts.create', 'contacts.update',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 14. Liaison Officer (Visa) ─────────────────────────────────────
            // Randy Callueng — physically pays embassy; updates OR number after payment.
            // Modules: 1🚫 2🚫 3✏️ 4🚫 5👁 6🚫 7🚫 8🚫 9🚫 10🚫 11🚫 12🚫 13🚫 14🔒 15🔒 16👁 17🔒
            'liaison_officer_visa' => [
                // Module 3 — Visa (reads embassy payment details; pays embassy; records OR)
                'visa.view', 'visa.pay_embassy', 'visa.endorse_or',
                // Module 5 — Payables (reads Visa-originated payables only)
                'payables.view_assigned',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (needs embassy contact details for filing)
                'contacts.view',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 15. Visa & Documentation Officer ──────────────────────────────
            // Ricci Joy Alcaraz, Joanne May Evasco — own applications only.
            // Modules: 1🚫 2🚫 3🔒 4🚫 5🚫 6🚫 7🚫 8🚫 9🚫 10🚫 11🚫 12🔒 13👁 14🔒 15🔒 16✏️ 17🔒
            'visa_documentation_officer' => [
                // Module 3 — Visa (own applications only)
                'visa.view', 'visa.create', 'visa.update',
                'visa.update_status', 'visa.request_payment',
                // Module 12 — Sales Summary (own agent summary only)
                'sales.view_own',
                // Module 13 — Marketing (view published itineraries only)
                'marketing.view_itinerary',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (creates client contacts; edits own entries)
                'contacts.view', 'contacts.create', 'contacts.update_own',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 16. Branch Supervisor ─────────────────────────────────────────
            // Anjelly Miroy — full access to all Ormoc records; formally approves
            // before forwarding invoice + quotation + payment to QC accounting.
            // Modules: 1🚫 2🌿 3🚫 4🌿 5🚫 6🚫 7🚫 8👁 9🚫 10🚫 11🚫 12🌿 13👁 14🔒 15🌿 16✏️ 17🔒
            //
            // Gap 5 fix: this role now uses reservation.* (the unified module that
            // post-merge guards Ormoc bookings) instead of ormoc.* — ormoc.* no
            // longer guards any route, since OrmocBranchController/routes are
            // disabled. approve/escalate/forward_accounting map directly onto the
            // same actions exposed under the Reservation module.
            'branch_supervisor' => [
                // Module 1/2 — Reservation & Booking (full Ormoc branch access: CRU, no delete)
                'reservation.view', 'reservation.create', 'reservation.update',
                'reservation.approve', 'reservation.escalate', 'reservation.forward_accounting',
                // Module 4 — AR (read Ormoc collectibles only)
                'ar.view_own',
                // Module 8 — Cashbond (read-only — portal balances before Ormoc bookings)
                'cashbond.view_readonly',
                // Module 12 — Sales Summary (Ormoc branch summary only)
                'sales.view_branch',
                // Module 13 — Marketing (view published itineraries only)
                'marketing.view_itinerary',
                // Module 14 — HR (own record only; HR is centralized at QC)
                'hr.view_own',
                // Module 15 — Attendance (own + Ormoc team)
                'attendance.view_team', 'attendance.view_own', 'attendance.record',
                'attendance.edit_team', 'attendance.report',
                // Module 16 — Contacts (creates Ormoc client contacts; edits own entries)
                'contacts.view', 'contacts.create', 'contacts.update_own',
                // Module 17 — Notifications
                'notifications.view', 'notifications.receive',
            ],

            // ── 17. Branch Sales Officer ───────────────────────────────────────
            // Louie Bacalso, Rhea Dedace, Kay Parrilla — own bookings only.
            // Modules: 1🚫 2🔒 3🚫 4🚫 5🚫 6🚫 7🚫 8👁 9🚫 10🚫 11🚫 12🔒 13👁 14🔒 15🔒 16✏️ 17🔒
            //
            // Gap 5 fix: reservation.* replaces ormoc.* (see branch_supervisor note above).
            'branch_sales_officer' => [
                // Module 1/2 — Reservation & Booking (own bookings only)
                'reservation.view', 'reservation.create', 'reservation.update',
                // Module 8 — Cashbond (read-only — portal balances before Ormoc bookings)
                'cashbond.view_readonly',
                // Module 12 — Sales Summary (own agent summary only)
                'sales.view_own',
                // Module 13 — Marketing (view published itineraries only)
                'marketing.view_itinerary',
                // Module 14 — HR (own record only)
                'hr.view_own',
                // Module 15 — Attendance (own record only)
                'attendance.view_own', 'attendance.record',
                // Module 16 — Contacts (creates Ormoc client contacts; edits own entries)
                'contacts.view', 'contacts.create', 'contacts.update_own',
                // Module 17 — Notifications
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
            // Confirmed real users
            ['name' => 'Jojit R. Tismo',              'email' => 'jrt@amkor.ph',         'role' => 'president',                    'branch_id' => $qcMain],
            ['name' => 'Marianne M. Tismo',            'email' => 'marianne@amkor.ph',    'role' => 'chief_operating_officer',      'branch_id' => $qcMain],
            ['name' => 'John Vic Galendez',            'email' => 'johnvic@amkor.ph',     'role' => 'finance_admin_supervisor',     'branch_id' => $qcMain],
            ['name' => 'Judy Ann Gregorio',            'email' => 'judyann@amkor.ph',     'role' => 'administrative_assistant',     'branch_id' => $qcMain],
            ['name' => 'Dialectica Baguio',            'email' => 'dalle@amkor.ph',       'role' => 'liaison_officer_finance',      'branch_id' => $qcMain],
            ['name' => 'Mark Stephen Lagahit',         'email' => 'mark@amkor.ph',        'role' => 'liaison_officer_finance',      'branch_id' => $qcMain],
            ['name' => 'Rochelle Tienzo',              'email' => 'rochelle@amkor.ph',    'role' => 'general_sales_manager',        'branch_id' => $qcMain],
            ['name' => 'Jhonalyn Ramos',               'email' => 'jhona@amkor.ph',       'role' => 'sales_ticketing_officer',      'branch_id' => $qcMain],
            ['name' => 'Jhoanna Marie Tismo',          'email' => 'jhoanna@amkor.ph',     'role' => 'business_development_manager', 'branch_id' => $qcMain],
            ['name' => 'Maria Alexandria De Quiros',   'email' => 'alex@amkor.ph',        'role' => 'visa_documentation_supervisor','branch_id' => $qcMain],
            ['name' => 'Randy Callueng',               'email' => 'randy@amkor.ph',       'role' => 'liaison_officer_visa',         'branch_id' => $qcMain],
            ['name' => 'Anjelly Miroy',                'email' => 'anjelly@amkor.ph',     'role' => 'branch_supervisor',            'branch_id' => $ormoc],
            // Placeholder accounts — replaced with real staff from org chart + Excel
            ['name' => 'Kristia Cassandra Borbe',  'email' => 'accounting1@amkor.ph', 'role' => 'accounting_assistant',         'branch_id' => $qcMain],
            ['name' => 'Zarah Mae Padecio',         'email' => 'accounting2@amkor.ph', 'role' => 'accounting_assistant',         'branch_id' => $qcMain],
            ['name' => 'Ashly Joyce Ayag',          'email' => 'accounting3@amkor.ph', 'role' => 'accounting_assistant',         'branch_id' => $qcMain],
            ['name' => 'Elaiza Joaquin',            'email' => 'resa1@amkor.ph',       'role' => 'sales_reservation_officer',    'branch_id' => $qcMain],
            ['name' => 'Christine Mateo',           'email' => 'resa2@amkor.ph',       'role' => 'sales_reservation_officer',    'branch_id' => $qcMain],
            ['name' => 'Kristine Grefal',           'email' => 'resa3@amkor.ph',       'role' => 'sales_reservation_officer',    'branch_id' => $qcMain],
            ['name' => 'Ederlyn Boyles',            'email' => 'resa4@amkor.ph',       'role' => 'sales_reservation_officer',    'branch_id' => $qcMain],
            ['name' => 'Jezielyn Ferol',            'email' => 'resa5@amkor.ph',       'role' => 'sales_reservation_officer',    'branch_id' => $qcMain],
            ['name' => 'Wenchelle Anne Novelo',     'email' => 'resa6@amkor.ph',       'role' => 'sales_reservation_officer',    'branch_id' => $qcMain],
            ['name' => 'Angela Beatriz Lo',         'email' => 'groups1@amkor.ph',     'role' => 'group_sales_officer',          'branch_id' => $qcMain],
            ['name' => 'Kyla Luna',                 'email' => 'groups2@amkor.ph',     'role' => 'group_sales_officer',          'branch_id' => $qcMain],
            ['name' => 'Mitzi Vidor',               'email' => 'marketing1@amkor.ph',  'role' => 'sales_marketing_officer',      'branch_id' => $qcMain],
            ['name' => 'Jahara Jade Ramirez',       'email' => 'marketing2@amkor.ph',  'role' => 'sales_marketing_officer',      'branch_id' => $qcMain],
            // Visa officers — Ricci and Joanne confirmed. Mel, Kae, Mimi: full names TBC from Alex/John Vic.
            // Using confirmed names where known; placeholder names for the three pending.
            ['name' => 'Ricci Joy Alcaraz',         'email' => 'visa1@amkor.ph',       'role' => 'visa_documentation_officer',   'branch_id' => $qcMain],
            ['name' => 'Joanne May Evasco',         'email' => 'visa2@amkor.ph',       'role' => 'visa_documentation_officer',   'branch_id' => $qcMain],
            ['name' => '[Visa Officer — Mel]',      'email' => 'visa3@amkor.ph',       'role' => 'visa_documentation_officer',   'branch_id' => $qcMain],
            ['name' => '[Visa Officer — Kae]',      'email' => 'visa4@amkor.ph',       'role' => 'visa_documentation_officer',   'branch_id' => $qcMain],
            ['name' => '[Visa Officer — Mimi]',     'email' => 'visa5@amkor.ph',       'role' => 'visa_documentation_officer',   'branch_id' => $qcMain],
            // Ormoc branch sales officers
            ['name' => 'Louie Jay Bacalso',         'email' => 'ormoc1@amkor.ph',      'role' => 'branch_sales_officer',         'branch_id' => $ormoc],
            ['name' => 'Rhea Mae Dedace',           'email' => 'ormoc2@amkor.ph',      'role' => 'branch_sales_officer',         'branch_id' => $ormoc],
            ['name' => 'Kay Ann Mavel Parrilla',    'email' => 'ormoc3@amkor.ph',      'role' => 'branch_sales_officer',         'branch_id' => $ormoc],
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
        // Sourced directly from the client's Excel files (June 2026).
        // sub_group drives the Resa vs Groups split in the Sales Summary report.
        $agentCodes = [
            // ── RESA — Individual bookings ────────────────────────────────────
            ['code' => 'RT',    'department' => 'resa', 'sub_group' => 'individual'],  // Rochelle Tienzo (GSM — also agents in RESA)
            ['code' => 'RP',    'department' => 'resa', 'sub_group' => 'individual'],  // Identity TBC (Phase 5.2 — ask Rochelle/John Vic)
            ['code' => 'EJ',    'department' => 'resa', 'sub_group' => 'individual'],  // Elaiza Joaquin
            ['code' => 'CM',    'department' => 'resa', 'sub_group' => 'individual'],  // Christine Mateo
            ['code' => 'KG',    'department' => 'resa', 'sub_group' => 'individual'],  // Kristine Grefal
            ['code' => 'JR',    'department' => 'resa', 'sub_group' => 'individual'],  // Jhonalyn Ramos (OIC — sales_ticketing_officer)
            ['code' => 'EB',    'department' => 'resa', 'sub_group' => 'individual'],  // Ederlyn Boyles
            ['code' => 'JF',    'department' => 'resa', 'sub_group' => 'individual'],  // Jezielyn Ferol
            ['code' => 'WAN',   'department' => 'resa', 'sub_group' => 'individual'],  // Wenchelle Anne Novelo
            // ── RESA — Group bookings ─────────────────────────────────────────
            ['code' => 'MMT',   'department' => 'resa', 'sub_group' => 'groups'],      // Jhoanna Marie Tismo (BDM; also books groups)
            ['code' => 'JMMT',  'department' => 'resa', 'sub_group' => 'groups'],      // Jhoanna Marie Tismo (alt code — Phase 5.1: consolidate with client)
            ['code' => 'AL',    'department' => 'resa', 'sub_group' => 'groups'],      // Angela Beatriz Lo
            ['code' => 'KL',    'department' => 'resa', 'sub_group' => 'groups'],      // Kyla Luna
            // ── Visa & Documentation ──────────────────────────────────────────
            ['code' => 'ALEX',  'department' => 'visa', 'sub_group' => null],          // Maria Alexandria De Quiros (Supervisor)
            ['code' => 'RICCI', 'department' => 'visa', 'sub_group' => null],          // Ricci Joy Alcaraz
            ['code' => 'JME',   'department' => 'visa', 'sub_group' => null],          // Joanne May Evasco
            ['code' => 'MEL',   'department' => 'visa', 'sub_group' => null],          // Mel (full name TBC from Alex/John Vic)
            ['code' => 'KAE',   'department' => 'visa', 'sub_group' => null],          // Kae (full name TBC)
            ['code' => 'MIMI',  'department' => 'visa', 'sub_group' => null],          // Mimi (full name TBC)
            ['code' => 'MMT',   'department' => 'visa', 'sub_group' => null],          // Jhoanna Marie Tismo (also appears in Visa Excel)
            // ── Ormoc Branch ─────────────────────────────────────────────────
            ['code' => 'AM',    'department' => 'ormoc', 'sub_group' => null],         // Anjelly Miroy (Branch Supervisor)
            ['code' => 'LB',    'department' => 'ormoc', 'sub_group' => null],         // Louie Jay Bacalso
            ['code' => 'RD',    'department' => 'ormoc', 'sub_group' => null],         // Rhea Mae Dedace
            ['code' => 'KP',    'department' => 'ormoc', 'sub_group' => null],         // Kay Ann Mavel Parrilla
            ['code' => 'MMT',   'department' => 'ormoc', 'sub_group' => null],         // Jhoanna Marie Tismo (appears in Ormoc summary too)
        ];

        foreach ($agentCodes as $code) {
            DB::table('agent_codes')->updateOrInsert(
                ['code' => $code['code'], 'department' => $code['department']],
                array_merge($code, ['is_active' => true, 'created_at' => now(), 'updated_at' => now()])
            );
        }

        // ── 6. Link known users to their agent codes ──────────────────────────
        // Sourced from Excel agent breakdown tables (June 2026).
        // Placeholder visa officers (Mel, Kae, Mimi) linked once their real
        // accounts are updated with correct emails in the admin UI.
        $userCodeLinks = [
            'rochelle@amkor.ph'   => 'RT',    // Rochelle Tienzo — also books as agent
            'jhona@amkor.ph'      => 'JR',    // Jhonalyn Ramos — OIC sales_ticketing_officer
            'jhoanna@amkor.ph'    => 'MMT',   // Jhoanna Marie Tismo — BDM; primary MMT code
            'alex@amkor.ph'       => 'ALEX',  // Maria Alexandria De Quiros — visa supervisor
            'resa1@amkor.ph'      => 'EJ',    // Elaiza Joaquin
            'resa2@amkor.ph'      => 'CM',    // Christine Mateo
            'resa3@amkor.ph'      => 'KG',    // Kristine Grefal
            'resa4@amkor.ph'      => 'EB',    // Ederlyn Boyles
            'resa5@amkor.ph'      => 'JF',    // Jezielyn Ferol
            'resa6@amkor.ph'      => 'WAN',   // Wenchelle Anne Novelo
            'groups1@amkor.ph'    => 'AL',    // Angela Beatriz Lo
            'groups2@amkor.ph'    => 'KL',    // Kyla Luna
            'visa1@amkor.ph'      => 'RICCI', // Ricci Joy Alcaraz
            'visa2@amkor.ph'      => 'JME',   // Joanne May Evasco
            'visa3@amkor.ph'      => 'MEL',   // Mel — full name TBC
            'visa4@amkor.ph'      => 'KAE',   // Kae — full name TBC
            'visa5@amkor.ph'      => 'MIMI',  // Mimi — full name TBC
            'anjelly@amkor.ph'    => 'AM',    // Anjelly Miroy — Ormoc branch supervisor
            'ormoc1@amkor.ph'     => 'LB',    // Louie Jay Bacalso
            'ormoc2@amkor.ph'     => 'RD',    // Rhea Mae Dedace
            'ormoc3@amkor.ph'     => 'KP',    // Kay Ann Mavel Parrilla
        ];

        foreach ($userCodeLinks as $email => $code) {
            DB::table('users')
                ->where('email', $email)
                ->update(['agent_code' => $code, 'updated_at' => now()]);
        }
    }
}