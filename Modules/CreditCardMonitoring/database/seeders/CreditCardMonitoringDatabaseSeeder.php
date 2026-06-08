<?php

namespace Modules\CreditCardMonitoring\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CreditCardMonitoringDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $dalle = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');

        // ── Credit Cards ────────────────────────────────────────────────────
        $cards = [
            [
                'card_name' => 'BDO Corporate Visa', 'bank_name' => 'BDO Unibank',
                'last_four' => '1234', 'statement_cut_off' => 15, 'due_day' => 5,
                'is_active' => true, 'notes' => 'Primary corporate card for travel bookings',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'card_name' => 'BPI Mastercard', 'bank_name' => 'BPI',
                'last_four' => '5678', 'statement_cut_off' => 20, 'due_day' => 10,
                'is_active' => true, 'notes' => 'Secondary card for office expenses',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'card_name' => 'Metrobank JCB', 'bank_name' => 'Metrobank',
                'last_four' => '9012', 'statement_cut_off' => 25, 'due_day' => 15,
                'is_active' => false, 'notes' => 'Inactive - replaced by BDO Visa',
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($cards as $c) {
            DB::table('credit_cards')->updateOrInsert(
                ['card_name' => $c['card_name']],
                $c
            );
        }

        $bdoVisa = DB::table('credit_cards')->where('card_name', 'BDO Corporate Visa')->value('id');
        $bpiMCard = DB::table('credit_cards')->where('card_name', 'BPI Mastercard')->value('id');
        $metroJcb = DB::table('credit_cards')->where('card_name', 'Metrobank JCB')->value('id');

        $v4 = DB::table('vouchers')->where('voucher_no', 'DV-2026-004')->value('id');

        // ── Credit Card Payments ────────────────────────────────────────────
        $payments = [
            [
                'credit_card_id' => $bdoVisa, 'payment_no' => 'CCP-2026-001',
                'amount' => 45000.00, 'due_date' => '2026-03-05',
                'statement_date' => '2026-02-15', 'payment_date' => '2026-03-03',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-25 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-28 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-03-03 11:00:00',
                'voucher_id' => $v4,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'credit_card_id' => $bdoVisa, 'payment_no' => 'CCP-2026-002',
                'amount' => 32000.00, 'due_date' => '2026-05-05',
                'statement_date' => '2026-04-15', 'payment_date' => null,
                'status' => 'overdue',
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'voucher_id' => null,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'credit_card_id' => $bpiMCard, 'payment_no' => 'CCP-2026-003',
                'amount' => 15000.00, 'due_date' => '2026-04-10',
                'statement_date' => '2026-03-20', 'payment_date' => '2026-04-08',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-04-01 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-04-05 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-04-08 11:00:00',
                'voucher_id' => null,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'credit_card_id' => $bpiMCard, 'payment_no' => 'CCP-2026-004',
                'amount' => 8500.00, 'due_date' => '2026-06-10',
                'statement_date' => '2026-05-20', 'payment_date' => null,
                'status' => 'pending',
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-05-25 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'voucher_id' => null,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'credit_card_id' => $metroJcb, 'payment_no' => 'CCP-2026-005',
                'amount' => 22000.00, 'due_date' => '2026-02-15',
                'statement_date' => '2026-01-25', 'payment_date' => '2026-02-12',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-05 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-08 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-02-12 11:00:00',
                'voucher_id' => null,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'credit_card_id' => $metroJcb, 'payment_no' => 'CCP-2026-006',
                'amount' => 5000.00, 'due_date' => '2026-03-15',
                'statement_date' => '2026-02-25', 'payment_date' => '2026-03-10',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-03-05 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-03-08 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-03-10 11:00:00',
                'voucher_id' => null,
                'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($payments as $p) {
            DB::table('credit_card_payments')->insert($p);
        }
    }
}
