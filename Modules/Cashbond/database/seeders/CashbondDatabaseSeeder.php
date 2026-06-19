<?php

namespace Modules\Cashbond\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CashbondDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo        = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');
        $gsm        = DB::table('users')->where('email', 'gsm@amkor.ph')->value('id');

        // ── Cashbond Portals ──────────────────────────────────────────────────
        DB::table('cashbond_reloads')->delete();
        DB::table('cashbond_portals')->delete();

        $portals = [
            [
                'name'                => 'AirAsia',
                'current_balance'     => 48500.00,
                'maintaining_balance' => 20000.00,
                'is_active'           => true,
                'notes'               => 'Used for AK domestic & regional bookings. Reload when balance drops below PHP 20,000.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'Cebu Pacific',
                'current_balance'     => 72000.00,
                'maintaining_balance' => 30000.00,
                'is_active'           => true,
                'notes'               => 'High-volume domestic portal. Maintaining balance set at PHP 30,000.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'Philippine Airlines',
                'current_balance'     => 95000.00,
                'maintaining_balance' => 50000.00,
                'is_active'           => true,
                'notes'               => 'PAL corporate and leisure bookings. Maintaining balance PHP 50,000.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'Jetstar',
                'current_balance'     => 12800.00,
                'maintaining_balance' => 10000.00,
                'is_active'           => true,
                'notes'               => 'Low-volume portal. Reload as needed for AU/SG routes.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'Singapore Airlines',
                'current_balance'     => 38500.00,
                'maintaining_balance' => 25000.00,
                'is_active'           => true,
                'notes'               => 'SQ corporate long-haul bookings. Maintaining balance PHP 25,000.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'Korea Air (KE)',
                'current_balance'     => 8200.00,
                'maintaining_balance' => 10000.00,
                'is_active'           => true,
                'notes'               => 'ALERT: Balance below maintaining level. Reload request pending.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'Garuda Indonesia',
                'current_balance'     => 22000.00,
                'maintaining_balance' => 15000.00,
                'is_active'           => true,
                'notes'               => 'Bali and Jakarta routes. Maintaining balance PHP 15,000.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'Air Juan',
                'current_balance'     => 5500.00,
                'maintaining_balance' => null,
                'is_active'           => true,
                'notes'               => 'Island hopper routes (Palawan, Siargao). No threshold set yet.',
                'created_by'          => $accounting,
                'updated_by'          => $accounting,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
        ];

        DB::table('cashbond_portals')->insert($portals);

        // Reload portal IDs
        $airAsiaId   = DB::table('cashbond_portals')->where('name', 'AirAsia')->value('id');
        $cebId       = DB::table('cashbond_portals')->where('name', 'Cebu Pacific')->value('id');
        $palId       = DB::table('cashbond_portals')->where('name', 'Philippine Airlines')->value('id');
        $sqId        = DB::table('cashbond_portals')->where('name', 'Singapore Airlines')->value('id');
        $keId        = DB::table('cashbond_portals')->where('name', 'Korea Air (KE)')->value('id');
        $gaId        = DB::table('cashbond_portals')->where('name', 'Garuda Indonesia')->value('id');

        // ── Cashbond Reload Requests ──────────────────────────────────────────
        $reloads = [
            [
                'portal_id'            => $palId,
                'reload_no'            => 'CBR-2026-00001',
                'amount'               => 100000.00,
                'request_date'         => '2026-01-05',
                'deposit_date'         => '2026-01-07',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-01-05 14:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-01-06 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-01-07 10:30:00',
                'supplier_notified'    => true,
                'supplier_notified_at' => '2026-01-07 11:00:00',
                'balance_updated'      => true,
                'voucher_id'           => null,
                'remarks'              => 'Top-up to ensure sufficient balance for Jan group bookings.',
                'audit_remarks'        => null,
                'created_by'           => $accounting,
                'updated_by'           => $accounting,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
            [
                'portal_id'            => $cebId,
                'reload_no'            => 'CBR-2026-00002',
                'amount'               => 80000.00,
                'request_date'         => '2026-01-18',
                'deposit_date'         => '2026-01-20',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-01-18 15:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-01-19 10:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-01-20 11:00:00',
                'supplier_notified'    => true,
                'supplier_notified_at' => '2026-01-20 11:30:00',
                'balance_updated'      => true,
                'voucher_id'           => null,
                'remarks'              => '5J balance top-up for Boracay and Cebu bookings batch.',
                'audit_remarks'        => null,
                'created_by'           => $accounting,
                'updated_by'           => $accounting,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
            [
                'portal_id'            => $airAsiaId,
                'reload_no'            => 'CBR-2026-00003',
                'amount'               => 50000.00,
                'request_date'         => '2026-02-15',
                'deposit_date'         => '2026-02-17',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-02-15 14:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-02-16 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-02-17 10:00:00',
                'supplier_notified'    => true,
                'supplier_notified_at' => '2026-02-17 10:30:00',
                'balance_updated'      => true,
                'voucher_id'           => null,
                'remarks'              => 'AirAsia reload for KL group (RES-2026-007) and regional bookings.',
                'audit_remarks'        => null,
                'created_by'           => $accounting,
                'updated_by'           => $accounting,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
            [
                'portal_id'            => $sqId,
                'reload_no'            => 'CBR-2026-00004',
                'amount'               => 60000.00,
                'request_date'         => '2026-02-25',
                'deposit_date'         => '2026-02-27',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-02-25 14:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-02-26 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-02-27 10:00:00',
                'supplier_notified'    => true,
                'supplier_notified_at' => '2026-02-27 11:00:00',
                'balance_updated'      => true,
                'voucher_id'           => null,
                'remarks'              => 'SQ reload for PHT Inc. Singapore group (RES-2026-003).',
                'audit_remarks'        => null,
                'created_by'           => $accounting,
                'updated_by'           => $accounting,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
            [
                'portal_id'            => $gaId,
                'reload_no'            => 'CBR-2026-00005',
                'amount'               => 40000.00,
                'request_date'         => '2026-05-10',
                'deposit_date'         => '2026-05-12',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-05-10 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-05-11 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-05-12 10:00:00',
                'supplier_notified'    => true,
                'supplier_notified_at' => '2026-05-12 10:30:00',
                'balance_updated'      => true,
                'voucher_id'           => null,
                'remarks'              => 'Garuda reload for Ayala Bali incentive (RES-2026-009).',
                'audit_remarks'        => null,
                'created_by'           => $accounting,
                'updated_by'           => $accounting,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
            [
                'portal_id'            => $keId,
                'reload_no'            => 'CBR-2026-00006',
                'amount'               => 30000.00,
                'request_date'         => '2026-06-10',
                'deposit_date'         => null,
                'approval_status'      => 'approved',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-06-10 11:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-06-11 09:00:00',
                'released_by'          => null,
                'released_at'          => null,
                'supplier_notified'    => false,
                'supplier_notified_at' => null,
                'balance_updated'      => false,
                'voucher_id'           => null,
                'remarks'              => 'URGENT: KE balance below maintaining threshold. Reload PHP 30,000.',
                'audit_remarks'        => 'Awaiting release — CV to be prepared.',
                'created_by'           => $accounting,
                'updated_by'           => $coo,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
        ];

        DB::table('cashbond_reloads')->insert($reloads);
    }
}
