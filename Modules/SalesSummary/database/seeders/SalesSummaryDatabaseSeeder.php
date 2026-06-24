<?php

namespace Modules\SalesSummary\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalesSummaryDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain    = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $ormoc     = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $jhona     = DB::table('users')->where('email', 'jhona@amkor.ph')->value('id');
        $visa      = DB::table('users')->where('email', 'alex@amkor.ph')->value('id');
        $ormocUser = DB::table('users')->where('email', 'anjelly@amkor.ph')->value('id');
        $coo       = DB::table('users')->where('email', 'marianne@amkor.ph')->value('id');

        $targets = [
            // ── May 2026 ──────────────────────────────────────────────────
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 5, 'target_amount' => 500000.00,
                'remarks' => 'QC Main reservation target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'RT',
                'year' => 2026, 'month' => 5, 'target_amount' => 150000.00,
                'remarks' => 'RT individual target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'JHONA',
                'year' => 2026, 'month' => 5, 'target_amount' => 120000.00,
                'remarks' => 'Jhona individual target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'MMT',
                'year' => 2026, 'month' => 5, 'target_amount' => 130000.00,
                'remarks' => 'MMT groups target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'RESA',
                'year' => 2026, 'month' => 5, 'target_amount' => 100000.00,
                'remarks' => 'RESA sub-group target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            ['department' => 'visa', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 5, 'target_amount' => 200000.00,
                'remarks' => 'Visa Centre overall target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'visa', 'branch_id' => $qcMain, 'agent_code' => 'ALEX',
                'year' => 2026, 'month' => 5, 'target_amount' => 50000.00,
                'remarks' => 'Alex target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'visa', 'branch_id' => $qcMain, 'agent_code' => 'RICCI',
                'year' => 2026, 'month' => 5, 'target_amount' => 45000.00,
                'remarks' => 'Ricci target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            ['department' => 'ormoc', 'branch_id' => $ormoc, 'agent_code' => null,
                'year' => 2026, 'month' => 5, 'target_amount' => 300000.00,
                'remarks' => 'Ormoc overall target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            ['department' => 'ar', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 5, 'target_amount' => 400000.00,
                'remarks' => 'AR collection target May', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            // ── June 2026 ──────────────────────────────────────────────────
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 6, 'target_amount' => 550000.00,
                'remarks' => 'QC Main reservation target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'RT',
                'year' => 2026, 'month' => 6, 'target_amount' => 160000.00,
                'remarks' => 'RT individual target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'JHONA',
                'year' => 2026, 'month' => 6, 'target_amount' => 130000.00,
                'remarks' => 'Jhona individual target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'MMT',
                'year' => 2026, 'month' => 6, 'target_amount' => 140000.00,
                'remarks' => 'MMT groups target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => 'RESA',
                'year' => 2026, 'month' => 6, 'target_amount' => 120000.00,
                'remarks' => 'RESA sub-group target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            ['department' => 'visa', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 6, 'target_amount' => 220000.00,
                'remarks' => 'Visa Centre overall target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'visa', 'branch_id' => $qcMain, 'agent_code' => 'ALEX',
                'year' => 2026, 'month' => 6, 'target_amount' => 55000.00,
                'remarks' => 'Alex target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'visa', 'branch_id' => $qcMain, 'agent_code' => 'RICCI',
                'year' => 2026, 'month' => 6, 'target_amount' => 50000.00,
                'remarks' => 'Ricci target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            ['department' => 'ormoc', 'branch_id' => $ormoc, 'agent_code' => null,
                'year' => 2026, 'month' => 6, 'target_amount' => 350000.00,
                'remarks' => 'Ormoc overall target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            ['department' => 'ar', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 6, 'target_amount' => 450000.00,
                'remarks' => 'AR collection target June', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],

            // ── January 2026 (historical) ──────────────────────────────────
            ['department' => 'reservation', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 1, 'target_amount' => 400000.00,
                'remarks' => 'QC Main reservation target Jan', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'visa', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 1, 'target_amount' => 150000.00,
                'remarks' => 'Visa Centre overall target Jan', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'ormoc', 'branch_id' => $ormoc, 'agent_code' => null,
                'year' => 2026, 'month' => 1, 'target_amount' => 250000.00,
                'remarks' => 'Ormoc overall target Jan', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
            ['department' => 'ar', 'branch_id' => $qcMain, 'agent_code' => null,
                'year' => 2026, 'month' => 1, 'target_amount' => 350000.00,
                'remarks' => 'AR collection target Jan', 'created_by' => $coo, 'updated_by' => $coo,
                'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($targets as $t) {
            DB::table('sales_targets')->updateOrInsert(
                [
                    'department' => $t['department'],
                    'branch_id' => $t['branch_id'],
                    'agent_code' => $t['agent_code'],
                    'year' => $t['year'],
                    'month' => $t['month'],
                ],
                $t
            );
        }
    }
}
