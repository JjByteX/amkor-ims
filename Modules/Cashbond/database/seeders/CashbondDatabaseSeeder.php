<?php

namespace Modules\Cashbond\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CashbondDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── Cashbond Portals ────────────────────────────────────────────────
        $portals = [
            'AirAsia',
            'Jetstar',
            'SupercatB2B',
            'Airswift',
            'Cebuana Lhuillier',
        ];

        foreach ($portals as $name) {
            DB::table('cashbond_portals')->updateOrInsert(
                ['name' => $name],
                [
                    'name' => $name,
                    'current_balance' => 0.00,
                    'maintaining_balance' => null,
                    'is_active' => true,
                    'notes' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // ── Cashbond Reloads ────────────────────────────────────────────────
        $dalle = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');

        $airAsia = DB::table('cashbond_portals')->where('name', 'AirAsia')->value('id');
        $jetstar = DB::table('cashbond_portals')->where('name', 'Jetstar')->value('id');
        $supercat = DB::table('cashbond_portals')->where('name', 'SupercatB2B')->value('id');
        $airswift = DB::table('cashbond_portals')->where('name', 'Airswift')->value('id');
        $cebucana = DB::table('cashbond_portals')->where('name', 'Cebuana Lhuillier')->value('id');

        $vCv005 = DB::table('vouchers')->where('voucher_no', 'CV-2026-007')->value('id');

        $reloads = [
            [
                'portal_id' => $airAsia, 'reload_no' => 'CR-2026-001', 'amount' => 30000.00,
                'request_date' => '2026-01-20', 'deposit_date' => '2026-01-22',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-01-21 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-01-21 14:00:00',
                'released_by' => $coo, 'released_at' => '2026-01-22 10:00:00',
                'supplier_notified' => true, 'supplier_notified_at' => '2026-01-22 11:00:00',
                'balance_updated' => true, 'voucher_id' => null,
                'remarks' => 'Initial reload for January bookings',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'portal_id' => $airAsia, 'reload_no' => 'CR-2026-002', 'amount' => 20000.00,
                'request_date' => '2026-03-10', 'deposit_date' => null,
                'approval_status' => 'approved', 'checked_by' => $dalle, 'checked_at' => '2026-03-11 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-03-12 10:00:00',
                'released_by' => null, 'released_at' => null,
                'supplier_notified' => false, 'supplier_notified_at' => null,
                'balance_updated' => false, 'voucher_id' => null,
                'remarks' => 'March top-up',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'portal_id' => $jetstar, 'reload_no' => 'CR-2026-003', 'amount' => 25000.00,
                'request_date' => '2026-02-05', 'deposit_date' => '2026-02-07',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-06 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-06 14:00:00',
                'released_by' => $coo, 'released_at' => '2026-02-07 10:00:00',
                'supplier_notified' => true, 'supplier_notified_at' => '2026-02-07 11:00:00',
                'balance_updated' => true, 'voucher_id' => $vCv005,
                'remarks' => 'February Jetstar reload',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'portal_id' => $supercat, 'reload_no' => 'CR-2026-004', 'amount' => 15000.00,
                'request_date' => '2026-04-01', 'deposit_date' => null,
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-04-02 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'supplier_notified' => false, 'supplier_notified_at' => null,
                'balance_updated' => false, 'voucher_id' => null,
                'remarks' => 'Supercat B2B reload for April',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'portal_id' => $supercat, 'reload_no' => 'CR-2026-005', 'amount' => 10000.00,
                'request_date' => '2026-05-15', 'deposit_date' => null,
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'supplier_notified' => false, 'supplier_notified_at' => null,
                'balance_updated' => false, 'voucher_id' => null,
                'remarks' => 'May top-up pending approval',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'portal_id' => $airswift, 'reload_no' => 'CR-2026-006', 'amount' => 18000.00,
                'request_date' => '2026-02-15', 'deposit_date' => '2026-02-17',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-16 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-16 14:00:00',
                'released_by' => $coo, 'released_at' => '2026-02-17 10:00:00',
                'supplier_notified' => true, 'supplier_notified_at' => '2026-02-17 11:00:00',
                'balance_updated' => true, 'voucher_id' => null,
                'remarks' => 'Airswift February reload',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'portal_id' => $cebucana, 'reload_no' => 'CR-2026-007', 'amount' => 12000.00,
                'request_date' => '2026-03-20', 'deposit_date' => '2026-03-22',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-03-21 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-03-21 14:00:00',
                'released_by' => $coo, 'released_at' => '2026-03-22 10:00:00',
                'supplier_notified' => true, 'supplier_notified_at' => '2026-03-22 11:00:00',
                'balance_updated' => true, 'voucher_id' => null,
                'remarks' => 'Cebuana Lhuillier March reload',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'portal_id' => $cebucana, 'reload_no' => 'CR-2026-008', 'amount' => 8000.00,
                'request_date' => '2026-05-10', 'deposit_date' => null,
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-05-11 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'supplier_notified' => false, 'supplier_notified_at' => null,
                'balance_updated' => false, 'voucher_id' => null,
                'remarks' => 'May reload awaiting approval',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($reloads as $r) {
            DB::table('cashbond_reloads')->updateOrInsert(
                ['reload_no' => $r['reload_no']],
                $r
            );
        }
    }
}
