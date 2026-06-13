<?php

namespace Modules\AccountsPayable\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountsPayableDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');

        $dalle = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');
        $auditor = DB::table('users')->where('email', 'auditor@amkor.ph')->value('id');

        $contactMariposa = DB::table('contacts')->where('name', 'Mariposa Travel Agency')->value('id');
        $contactBdo = DB::table('contacts')->where('name', 'BDO Unibank')->where('currency', 'PHP')->value('id');

        $v1 = DB::table('vouchers')->where('voucher_no', 'CV-2026-001')->value('id');
        $v2 = DB::table('vouchers')->where('voucher_no', 'DV-2026-002')->value('id');
        $v3 = DB::table('vouchers')->where('voucher_no', 'CV-2026-003')->value('id');
        $v4 = DB::table('vouchers')->where('voucher_no', 'DV-2026-004')->value('id');
        $v6 = DB::table('vouchers')->where('voucher_no', 'DV-2026-006')->value('id');

        $payables = [
            [
                'requisition_no' => 'REQ-2026-001', 'invoice_date' => '2026-01-05',
                'invoice_no' => 'INV-GLOBE-001', 'contact_id' => null, 'supplier_name' => 'Globe Telecom',
                'currency' => 'PHP', 'invoice_amount_php' => 2500.00, 'invoice_amount_usd' => 0, 'invoice_amount_jpy' => 0,
                'payment_php' => 2500.00, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 0, 'balance_usd' => 0, 'balance_jpy' => 0,
                'due_date' => '2026-01-20',
                'payment_date' => '2026-01-18', 'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-01-10 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-01-12 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-01-18 11:00:00',
                'mode_of_payment' => 'cash', 'voucher_id' => $v1,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'requisition_no' => 'REQ-2026-002', 'invoice_date' => '2026-02-01',
                'invoice_no' => 'INV-MERALCO-002', 'contact_id' => null, 'supplier_name' => 'MERALCO',
                'currency' => 'PHP', 'invoice_amount_php' => 8750.00, 'invoice_amount_usd' => 0, 'invoice_amount_jpy' => 0,
                'payment_php' => 8750.00, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 0, 'balance_usd' => 0, 'balance_jpy' => 0,
                'due_date' => '2026-02-15',
                'payment_date' => '2026-02-10', 'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-05 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-07 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-02-10 11:00:00',
                'mode_of_payment' => 'check', 'account_no' => '0002-7006-7663', 'check_no' => '001234',
                'voucher_id' => $v2,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'requisition_no' => 'REQ-2026-003', 'invoice_date' => '2026-02-15',
                'invoice_no' => 'INV-MARIPOSA-001', 'contact_id' => $contactMariposa, 'supplier_name' => 'Mariposa Travel Agency',
                'currency' => 'PHP', 'invoice_amount_php' => 15000.00, 'invoice_amount_usd' => 0, 'invoice_amount_jpy' => 0,
                'payment_php' => 15000.00, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 0, 'balance_usd' => 0, 'balance_jpy' => 0,
                'due_date' => '2026-03-15',
                'payment_date' => '2026-03-01', 'status' => 'paid',
                'approval_status' => 'approved', 'checked_by' => $dalle, 'checked_at' => '2026-02-20 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-25 10:00:00',
                'released_by' => null, 'released_at' => null,
                'mode_of_payment' => 'cash', 'voucher_id' => $v3,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'requisition_no' => 'REQ-2026-004', 'invoice_date' => '2026-03-01',
                'invoice_no' => 'INV-BDO-001', 'contact_id' => $contactBdo, 'supplier_name' => 'BDO Unibank',
                'currency' => 'PHP', 'invoice_amount_php' => 45000.00, 'invoice_amount_usd' => 0, 'invoice_amount_jpy' => 0,
                'payment_php' => 0, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 45000.00, 'balance_usd' => 0, 'balance_jpy' => 0,
                'due_date' => '2026-04-01', 'status' => 'overdue',
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-03-10 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'mode_of_payment' => 'bank_deposit', 'account_no' => '0002-7006-7663',
                'voucher_id' => $v4,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'requisition_no' => 'REQ-2026-005', 'invoice_date' => '2026-03-15',
                'invoice_no' => 'INV-PLDT-001', 'contact_id' => null, 'supplier_name' => 'PLDT',
                'currency' => 'PHP', 'invoice_amount_php' => 1800.00, 'invoice_amount_usd' => 0, 'invoice_amount_jpy' => 0,
                'payment_php' => 1800.00, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 0, 'balance_usd' => 0, 'balance_jpy' => 0,
                'due_date' => '2026-04-15',
                'payment_date' => '2026-04-10', 'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-03-20 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-03-25 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-04-10 11:00:00',
                'mode_of_payment' => 'check', 'check_no' => '001236',
                'voucher_id' => $v6,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'requisition_no' => 'REQ-2026-006', 'invoice_date' => '2026-04-01',
                'invoice_no' => 'INV-GLOBE-002', 'contact_id' => null, 'supplier_name' => 'Globe Telecom',
                'currency' => 'USD', 'invoice_amount_php' => 0, 'invoice_amount_usd' => 850.00, 'invoice_amount_jpy' => 0,
                'payment_php' => 0, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 0, 'balance_usd' => 850.00, 'balance_jpy' => 0,
                'due_date' => '2026-05-01', 'status' => 'overdue',
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'mode_of_payment' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'requisition_no' => 'REQ-2026-007', 'invoice_date' => '2026-05-01',
                'invoice_no' => 'INV-AIRASIA-001', 'contact_id' => null, 'supplier_name' => 'AirAsia',
                'currency' => 'PHP', 'invoice_amount_php' => 30000.00, 'invoice_amount_usd' => 0, 'invoice_amount_jpy' => 0,
                'payment_php' => 0, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 30000.00, 'balance_usd' => 0, 'balance_jpy' => 0,
                'due_date' => '2026-06-01', 'status' => 'current',
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'mode_of_payment' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'requisition_no' => 'REQ-2026-008', 'invoice_date' => '2026-05-15',
                'invoice_no' => 'INV-JETSTAR-001', 'contact_id' => null, 'supplier_name' => 'Jetstar Asia',
                'currency' => 'JPY', 'invoice_amount_php' => 0, 'invoice_amount_usd' => 0, 'invoice_amount_jpy' => 250000.00,
                'payment_php' => 0, 'payment_usd' => 0, 'payment_jpy' => 0,
                'balance_php' => 0, 'balance_usd' => 0, 'balance_jpy' => 250000.00,
                'due_date' => '2026-06-15', 'status' => 'current',
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-05-20 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'mode_of_payment' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($payables as $p) {
            DB::table('payables')->insert($p);
        }
    }
}
