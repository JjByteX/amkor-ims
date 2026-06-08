<?php

namespace Modules\Disbursement\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DisbursementDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');

        $dalle = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $auditor = DB::table('users')->where('email', 'auditor@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');

        $vouchers = [
            [
                'type' => 'cash', 'voucher_no' => 'CV-2026-001', 'date' => '2026-01-15',
                'payee' => 'Globe Telecom', 'check_no' => null, 'bank_name' => null,
                'check_date' => null, 'details' => 'Internet service - January 2026',
                'account_code' => '6101', 'account_description' => 'Utilities - Internet',
                'currency' => 'PHP', 'amount' => 2500.00, 'amount_usd' => 0, 'amount_jpy' => 0,
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-01-16 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-01-17 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-01-18 11:00:00',
                'remarks' => 'Monthly internet bill', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'type' => 'check', 'voucher_no' => 'DV-2026-002', 'date' => '2026-02-05',
                'payee' => 'MERALCO', 'check_no' => '001234', 'bank_name' => 'BDO',
                'check_date' => '2026-02-10', 'details' => 'Electric bill - February 2026',
                'account_code' => '6102', 'account_description' => 'Utilities - Electricity',
                'currency' => 'PHP', 'amount' => 8750.00, 'amount_usd' => 0, 'amount_jpy' => 0,
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-06 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-07 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-02-10 11:00:00',
                'remarks' => 'Monthly electricity', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'type' => 'cash', 'voucher_no' => 'CV-2026-003', 'date' => '2026-03-01',
                'payee' => 'Mariposa Travel Agency', 'check_no' => null, 'bank_name' => null,
                'check_date' => null, 'details' => 'Booking commission - March 2026',
                'account_code' => '6201', 'account_description' => 'Commission Expense',
                'currency' => 'PHP', 'amount' => 15000.00, 'amount_usd' => 0, 'amount_jpy' => 0,
                'approval_status' => 'approved', 'checked_by' => $dalle, 'checked_at' => '2026-03-02 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-03-03 10:00:00',
                'released_by' => null, 'released_at' => null,
                'remarks' => 'International booking commission', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'type' => 'check', 'voucher_no' => 'DV-2026-004', 'date' => '2026-03-15',
                'payee' => 'BDO Unibank', 'check_no' => '001235', 'bank_name' => 'BDO',
                'check_date' => '2026-03-20', 'details' => 'Credit card payment - BDO Visa',
                'account_code' => '6301', 'account_description' => 'Credit Card Payment',
                'currency' => 'PHP', 'amount' => 45000.00, 'amount_usd' => 0, 'amount_jpy' => 0,
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-03-16 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'remarks' => 'BDO Visa corporate card settlement', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'type' => 'cash', 'voucher_no' => 'CV-2026-005', 'date' => '2026-04-10',
                'payee' => 'Cebu Pacific Air', 'check_no' => null, 'bank_name' => null,
                'check_date' => null, 'details' => 'IATA remittance - April 2026',
                'account_code' => '6401', 'account_description' => 'IATA Payments',
                'currency' => 'PHP', 'amount' => 125000.00, 'amount_usd' => 0, 'amount_jpy' => 0,
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'remarks' => 'Monthly IATA billing settlement', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'type' => 'check', 'voucher_no' => 'DV-2026-006', 'date' => '2026-04-20',
                'payee' => 'PLDT', 'check_no' => '001236', 'bank_name' => 'BPI',
                'check_date' => '2026-04-25', 'details' => 'Telephone line - April 2026',
                'account_code' => '6103', 'account_description' => 'Utilities - Telephone',
                'currency' => 'PHP', 'amount' => 1800.00, 'amount_usd' => 0, 'amount_jpy' => 0,
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-04-21 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-04-22 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-04-25 11:00:00',
                'remarks' => 'Monthly telephone line', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'type' => 'cash', 'voucher_no' => 'CV-2026-007', 'date' => '2026-05-05',
                'payee' => 'Jetstar Asia', 'check_no' => null, 'bank_name' => null,
                'check_date' => null, 'details' => 'Cashbond reload - Jetstar',
                'account_code' => '6501', 'account_description' => 'Cashbond Reload',
                'currency' => 'PHP', 'amount' => 50000.00, 'amount_usd' => 0, 'amount_jpy' => 0,
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'remarks' => 'Portal cashbond reload', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'type' => 'check', 'voucher_no' => 'DV-2026-008', 'date' => '2026-05-15',
                'payee' => 'Philippine Airlines', 'check_no' => '001237', 'bank_name' => 'BDO',
                'check_date' => '2026-05-20', 'details' => 'IATA remittance - PAL May 2026',
                'account_code' => '6401', 'account_description' => 'IATA Payments',
                'currency' => 'USD', 'amount' => 0, 'amount_usd' => 3200.00, 'amount_jpy' => 0,
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-05-16 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'remarks' => 'USD IATA billing settlement', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($vouchers as $v) {
            DB::table('vouchers')->updateOrInsert(
                ['voucher_no' => $v['voucher_no']],
                $v
            );
        }

        $v1 = DB::table('vouchers')->where('voucher_no', 'CV-2026-001')->value('id');
        $v2 = DB::table('vouchers')->where('voucher_no', 'DV-2026-002')->value('id');
        $v3 = DB::table('vouchers')->where('voucher_no', 'CV-2026-003')->value('id');
        $v4 = DB::table('vouchers')->where('voucher_no', 'DV-2026-004')->value('id');
        $v6 = DB::table('vouchers')->where('voucher_no', 'DV-2026-006')->value('id');

        $entries = [
            [
                'date' => '2026-01-15', 'category' => 'cash', 'reference_no' => 'REF-001',
                'voucher_id' => $v1, 'payee' => 'Globe Telecom', 'description' => 'Internet service January 2026',
                'account_code' => '6101', 'currency' => 'PHP', 'amount' => 2500.00,
                'fund_type' => 'cash_on_hand', 'remarks' => null, 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-02-05', 'category' => 'check', 'reference_no' => 'REF-002',
                'voucher_id' => $v2, 'payee' => 'MERALCO', 'description' => 'Electric bill February 2026',
                'account_code' => '6102', 'currency' => 'PHP', 'amount' => 8750.00,
                'fund_type' => 'cash_on_bank', 'remarks' => 'Check #001234', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-03-01', 'category' => 'cash', 'reference_no' => 'REF-003',
                'voucher_id' => $v3, 'payee' => 'Mariposa Travel Agency', 'description' => 'Booking commission March 2026',
                'account_code' => '6201', 'currency' => 'PHP', 'amount' => 15000.00,
                'fund_type' => 'cash_on_hand', 'remarks' => 'International booking', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-03-15', 'category' => 'check', 'reference_no' => 'REF-004',
                'voucher_id' => $v4, 'payee' => 'BDO Unibank', 'description' => 'BDO Visa card settlement',
                'account_code' => '6301', 'currency' => 'PHP', 'amount' => 45000.00,
                'fund_type' => 'cash_on_bank', 'remarks' => 'Corporate card', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-01-20', 'category' => 'liaison_admin', 'reference_no' => 'REF-005',
                'voucher_id' => $v1, 'payee' => 'Globe Telecom', 'description' => 'Additional admin line',
                'account_code' => '6101', 'currency' => 'PHP', 'amount' => 500.00,
                'fund_type' => 'petty_cash', 'remarks' => 'Admin telephone', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-02-10', 'category' => 'liaison_banks', 'reference_no' => 'REF-006',
                'voucher_id' => $v2, 'payee' => 'MERALCO', 'description' => 'Bank deposit processing fee',
                'account_code' => '6104', 'currency' => 'PHP', 'amount' => 150.00,
                'fund_type' => 'cash_on_bank', 'remarks' => 'Transaction fee', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-04-10', 'category' => 'cash', 'reference_no' => 'REF-007',
                'voucher_id' => DB::table('vouchers')->where('voucher_no', 'CV-2026-005')->value('id'),
                'payee' => 'Cebu Pacific Air', 'description' => 'IATA remittance April 2026',
                'account_code' => '6401', 'currency' => 'PHP', 'amount' => 125000.00,
                'fund_type' => 'cash_on_bank', 'remarks' => 'Monthly IATA', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-04-20', 'category' => 'check', 'reference_no' => 'REF-008',
                'voucher_id' => $v6, 'payee' => 'PLDT', 'description' => 'Telephone line April 2026',
                'account_code' => '6103', 'currency' => 'PHP', 'amount' => 1800.00,
                'fund_type' => 'cash_on_bank', 'remarks' => 'Check #001236', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-05-05', 'category' => 'cash', 'reference_no' => 'REF-009',
                'voucher_id' => DB::table('vouchers')->where('voucher_no', 'CV-2026-007')->value('id'),
                'payee' => 'Jetstar Asia', 'description' => 'Cashbond reload Jetstar',
                'account_code' => '6501', 'currency' => 'PHP', 'amount' => 50000.00,
                'fund_type' => 'cash_on_bank', 'remarks' => 'Portal reload', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-05-15', 'category' => 'check', 'reference_no' => 'REF-010',
                'voucher_id' => DB::table('vouchers')->where('voucher_no', 'DV-2026-008')->value('id'),
                'payee' => 'Philippine Airlines', 'description' => 'IATA remittance PAL May 2026',
                'account_code' => '6401', 'currency' => 'USD', 'amount' => 0,
                'fund_type' => 'cash_on_bank', 'remarks' => 'USD settlement', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-03-10', 'category' => 'cash', 'reference_no' => 'REF-011',
                'voucher_id' => $v3, 'payee' => 'Mariposa Travel Agency', 'description' => 'Supplementary commission',
                'account_code' => '6201', 'currency' => 'PHP', 'amount' => 5000.00,
                'fund_type' => 'cash_on_hand', 'remarks' => 'Additional commission', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'date' => '2026-02-20', 'category' => 'liaison_admin', 'reference_no' => 'REF-012',
                'voucher_id' => $v2, 'payee' => 'MERALCO', 'description' => 'Late payment penalty',
                'account_code' => '6102', 'currency' => 'PHP', 'amount' => 250.00,
                'fund_type' => 'petty_cash', 'remarks' => 'Penalty fee', 'branch_id' => $qcMain,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($entries as $e) {
            DB::table('disbursement_entries')->insert($e);
        }
    }
}
