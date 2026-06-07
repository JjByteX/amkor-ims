<?php

namespace Modules\BillsMonitoring\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BillsMonitoringDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');

        $dalle = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');
        $auditor = DB::table('users')->where('email', 'auditor@amkor.ph')->value('id');
        $hradmin = DB::table('users')->where('email', 'hradmin@amkor.ph')->value('id');

        $v1 = DB::table('vouchers')->where('voucher_no', 'CV-2026-001')->value('id');
        $v2 = DB::table('vouchers')->where('voucher_no', 'DV-2026-002')->value('id');
        $v6 = DB::table('vouchers')->where('voucher_no', 'DV-2026-006')->value('id');

        $bills = [
            [
                'bill_type' => 'utility', 'name' => 'Globe Internet',
                'account_no' => 'GLOBE-887766', 'provider' => 'Globe Telecom',
                'amount' => 2500.00, 'due_date' => '2026-01-20',
                'payment_date' => '2026-01-18', 'mode_of_payment' => 'cash',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-01-12 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-01-15 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-01-18 11:00:00',
                'voucher_id' => $v1,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'bill_type' => 'utility', 'name' => 'MERALCO Electric',
                'account_no' => 'MERALCO-445566', 'provider' => 'Manila Electric Company',
                'amount' => 8750.00, 'due_date' => '2026-02-15',
                'payment_date' => '2026-02-10', 'mode_of_payment' => 'check',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-05 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-07 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-02-10 11:00:00',
                'voucher_id' => $v2,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'bill_type' => 'utility', 'name' => 'PLDT Telephone',
                'account_no' => 'PLDT-112233', 'provider' => 'PLDT Inc.',
                'amount' => 1800.00, 'due_date' => '2026-04-15',
                'payment_date' => '2026-04-10', 'mode_of_payment' => 'check',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-03-20 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-03-25 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-04-10 11:00:00',
                'voucher_id' => $v6,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'bill_type' => 'membership', 'name' => 'On-Ques Membership',
                'account_no' => 'ONQUES-001', 'provider' => 'On-Ques Travel System',
                'amount' => 12000.00, 'due_date' => '2026-03-31',
                'payment_date' => null, 'mode_of_payment' => null,
                'status' => 'overdue',
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'bill_type' => 'permit', 'name' => 'DTI Business Permit Renewal',
                'account_no' => null, 'provider' => 'DTI Philippines',
                'amount' => 5000.00, 'due_date' => '2026-01-31',
                'payment_date' => '2026-01-28', 'mode_of_payment' => 'bank_deposit',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $hradmin, 'checked_at' => '2026-01-25 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-01-26 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-01-28 11:00:00',
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $hradmin, 'updated_by' => $hradmin,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'bill_type' => 'premium', 'name' => 'Group Insurance Premium',
                'account_no' => 'INS-2026-AMKOR', 'provider' => 'Philam Life',
                'amount' => 35000.00, 'due_date' => '2026-06-30',
                'payment_date' => null, 'mode_of_payment' => null,
                'status' => 'pending',
                'approval_status' => 'checked', 'checked_by' => $hradmin, 'checked_at' => '2026-06-01 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $hradmin, 'updated_by' => $hradmin,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'bill_type' => 'supplies', 'name' => 'Office Supplies - May',
                'account_no' => null, 'provider' => 'National Book Store',
                'amount' => 3500.00, 'due_date' => '2026-05-31',
                'payment_date' => '2026-05-28', 'mode_of_payment' => 'cash',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-05-25 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-05-26 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-05-28 11:00:00',
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'bill_type' => 'utility', 'name' => 'Globe Internet - June',
                'account_no' => 'GLOBE-887766', 'provider' => 'Globe Telecom',
                'amount' => 2500.00, 'due_date' => '2026-07-20',
                'payment_date' => null, 'mode_of_payment' => null,
                'status' => 'pending',
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($bills as $b) {
            DB::table('bills')->insert($b);
        }
    }
}
