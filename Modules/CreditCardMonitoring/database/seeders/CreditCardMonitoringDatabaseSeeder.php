<?php

namespace Modules\CreditCardMonitoring\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CreditCardMonitoringDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $accounting = DB::table('users')->where('email', 'accounting1@amkor.ph')->value('id');
        $coo        = DB::table('users')->where('email', 'marianne@amkor.ph')->value('id');

        // ── 1. Master cards ───────────────────────────────────────────────────
        DB::table('credit_cards')->delete();

        $cards = [
            [
                'card_name'        => 'BDO Corporate Visa',
                'bank_name'        => 'Banco de Oro (BDO)',
                'last_four'        => '4821',
                'statement_cut_off'=> 15,
                'due_day'          => 10,
                'is_active'        => true,
                'notes'            => 'Primary corporate card. Used for recurring bills, supplier deposits, and travel expenses.',
                'created_by'       => $accounting,
                'updated_by'       => $accounting,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'card_name'        => 'BPI Blue Mastercard',
                'bank_name'        => 'Bank of the Philippine Islands (BPI)',
                'last_four'        => '3374',
                'statement_cut_off'=> 20,
                'due_day'          => 15,
                'is_active'        => true,
                'notes'            => 'Secondary card. Used for PLDT, Globe auto-charges, and miscellaneous expenses.',
                'created_by'       => $accounting,
                'updated_by'       => $accounting,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'card_name'        => 'Metrobank Travel Platinum Visa',
                'bank_name'        => 'Metropolitan Bank and Trust (Metrobank)',
                'last_four'        => '9056',
                'statement_cut_off'=> 25,
                'due_day'          => 20,
                'is_active'        => true,
                'notes'            => 'Travel card. Used for airline bookings, hotel reservations, and overseas transactions. Earns air miles.',
                'created_by'       => $accounting,
                'updated_by'       => $accounting,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'card_name'        => 'UnionBank EON Corporate Visa',
                'bank_name'        => 'UnionBank of the Philippines',
                'last_four'        => '6612',
                'statement_cut_off'=> 10,
                'due_day'          => 5,
                'is_active'        => false,
                'notes'            => 'Retired — account closed June 2025 after consolidation to BDO Corporate.',
                'created_by'       => $accounting,
                'updated_by'       => $accounting,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
        ];

        foreach ($cards as $card) {
            DB::table('credit_cards')->insert($card);
        }

        $bdoId  = DB::table('credit_cards')->where('last_four', '4821')->value('id');
        $bpiId  = DB::table('credit_cards')->where('last_four', '3374')->value('id');
        $mbtcId = DB::table('credit_cards')->where('last_four', '9056')->value('id');

        // ── 2. Payment records ────────────────────────────────────────────────
        DB::table('credit_card_payments')->delete();

        $base = [
            'voucher_id'      => null,
            'payment_date'    => null,
            'remarks'         => null,
            'audit_remarks'   => null,
            'checked_by'      => null,
            'checked_at'      => null,
            'approved_by'     => null,
            'approved_at'     => null,
            'released_by'     => null,
            'released_at'     => null,
            'created_by'      => $accounting,
            'updated_by'      => $accounting,
            'created_at'      => $now,
            'updated_at'      => $now,
        ];

        $payments = [

            // ── BDO Corporate Visa — RELEASED ────────────────────────────────

            array_merge($base, [
                'credit_card_id'  => $bdoId,
                'payment_no'      => 'CCP-2026-00001',
                'amount'          => 58420.50,
                'due_date'        => '2026-01-10',
                'statement_date'  => '2025-12-15',
                'payment_date'    => '2026-01-08',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-01-02 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-01-03 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-01-08 11:00:00',
                'remarks'         => 'Dec 2025 statement — suppliers, MERALCO auto-charge, office supplies.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bdoId,
                'payment_no'      => 'CCP-2026-00002',
                'amount'          => 72835.75,
                'due_date'        => '2026-02-10',
                'statement_date'  => '2026-01-15',
                'payment_date'    => '2026-02-07',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-02-01 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-02-03 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-02-07 11:00:00',
                'remarks'         => 'Jan 2026 statement — included Bali hotel deposit USD 4,200 (converted).',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bdoId,
                'payment_no'      => 'CCP-2026-00003',
                'amount'          => 65910.00,
                'due_date'        => '2026-03-10',
                'statement_date'  => '2026-02-15',
                'payment_date'    => '2026-03-07',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-03-01 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-03-03 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-03-07 11:00:00',
                'remarks'         => 'Feb 2026 statement — Globe postpaid, Maxicare, misc supplier charges.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bdoId,
                'payment_no'      => 'CCP-2026-00004',
                'amount'          => 88645.25,
                'due_date'        => '2026-04-10',
                'statement_date'  => '2026-03-15',
                'payment_date'    => '2026-04-08',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-04-01 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-04-02 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-04-08 11:00:00',
                'remarks'         => 'Mar 2026 statement — higher due to Garuda deposit charge.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bdoId,
                'payment_no'      => 'CCP-2026-00005',
                'amount'          => 94320.00,
                'due_date'        => '2026-05-10',
                'statement_date'  => '2026-04-15',
                'payment_date'    => '2026-05-07',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-05-01 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-05-02 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-05-07 11:00:00',
                'remarks'         => 'Apr 2026 statement — SM Seoul accommodation and ANA installment.',
            ]),

            // ── BDO Corporate Visa — IN PROGRESS ─────────────────────────────

            array_merge($base, [
                'credit_card_id'  => $bdoId,
                'payment_no'      => 'CCP-2026-00006',
                'amount'          => 81750.50,
                'due_date'        => '2026-06-10',
                'statement_date'  => '2026-05-15',
                'status'          => 'pending',
                'approval_status' => 'checked',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-06-01 09:00:00',
                'remarks'         => 'May 2026 statement — awaiting COO approval.',
                'audit_remarks'   => 'Charges verified against receipts. Includes PHP 35,640 Maxicare and PHP 22,560 MERALCO auto-charge. No disputes.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bdoId,
                'payment_no'      => 'CCP-2026-00007',
                'amount'          => 76200.00,
                'due_date'        => '2026-07-10',
                'statement_date'  => '2026-06-15',
                'status'          => 'pending',
                'approval_status' => 'pending',
                'remarks'         => 'Jun 2026 statement — received; for review.',
            ]),

            // ── BPI Blue Mastercard — RELEASED ───────────────────────────────

            array_merge($base, [
                'credit_card_id'  => $bpiId,
                'payment_no'      => 'CCP-2026-00008',
                'amount'          => 18420.00,
                'due_date'        => '2026-01-15',
                'statement_date'  => '2025-12-20',
                'payment_date'    => '2026-01-12',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-01-05 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-01-06 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-01-12 11:00:00',
                'remarks'         => 'Dec 2025 statement — PLDT and misc charges.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bpiId,
                'payment_no'      => 'CCP-2026-00009',
                'amount'          => 21380.50,
                'due_date'        => '2026-02-15',
                'statement_date'  => '2026-01-20',
                'payment_date'    => '2026-02-12',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-02-05 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-02-06 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-02-12 11:00:00',
                'remarks'         => 'Jan 2026 statement — PLDT, Globe, and office supplies.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bpiId,
                'payment_no'      => 'CCP-2026-00010',
                'amount'          => 19200.00,
                'due_date'        => '2026-03-15',
                'statement_date'  => '2026-02-20',
                'payment_date'    => '2026-03-12',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-03-05 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-03-06 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-03-12 11:00:00',
                'remarks'         => 'Feb 2026 statement — PLDT and Globe only.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bpiId,
                'payment_no'      => 'CCP-2026-00011',
                'amount'          => 22100.00,
                'due_date'        => '2026-04-15',
                'statement_date'  => '2026-03-20',
                'payment_date'    => '2026-04-12',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-04-05 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-04-06 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-04-12 11:00:00',
                'remarks'         => 'Mar 2026 statement — PLDT, Globe, and visa applicant-related charges.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $bpiId,
                'payment_no'      => 'CCP-2026-00012',
                'amount'          => 24880.00,
                'due_date'        => '2026-05-15',
                'statement_date'  => '2026-04-20',
                'payment_date'    => '2026-05-13',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-05-05 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-05-06 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-05-13 11:00:00',
                'remarks'         => 'Apr 2026 statement — PLDT reconnection charge + June advance billing.',
            ]),

            // ── BPI Blue Mastercard — OVERDUE ─────────────────────────────────

            array_merge($base, [
                'credit_card_id'  => $bpiId,
                'payment_no'      => 'CCP-2026-00013',
                'amount'          => 23450.00,
                'due_date'        => '2026-06-15',
                'statement_date'  => '2026-05-20',
                'status'          => 'overdue',
                'approval_status' => 'approved',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-06-05 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-06-06 10:00:00',
                'remarks'         => 'May 2026 statement — approved; pending fund release.',
                'audit_remarks'   => 'Statement verified. Past due date — need to release immediately to avoid late fees.',
            ]),

            // ── Metrobank Travel Platinum — RELEASED ─────────────────────────

            array_merge($base, [
                'credit_card_id'  => $mbtcId,
                'payment_no'      => 'CCP-2026-00014',
                'amount'          => 142600.00,
                'due_date'        => '2026-01-20',
                'statement_date'  => '2025-12-25',
                'payment_date'    => '2026-01-17',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-01-08 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-01-10 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-01-17 11:00:00',
                'remarks'         => 'Dec 2025 statement — CEB, PAL international tickets, and Cathay hotel deposit.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $mbtcId,
                'payment_no'      => 'CCP-2026-00015',
                'amount'          => 168400.00,
                'due_date'        => '2026-02-20',
                'statement_date'  => '2026-01-25',
                'payment_date'    => '2026-02-18',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-02-08 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-02-10 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-02-18 11:00:00',
                'remarks'         => 'Jan 2026 — CEB Bangkok roundtrip x6, HK hotel deposit, travel insurance batch.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $mbtcId,
                'payment_no'      => 'CCP-2026-00016',
                'amount'          => 215800.00,
                'due_date'        => '2026-03-20',
                'statement_date'  => '2026-02-25',
                'payment_date'    => '2026-03-18',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-03-08 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-03-10 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-03-18 11:00:00',
                'remarks'         => 'Feb 2026 — JL Tokyo x4, SQ Singapore x9. Large statement this month.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $mbtcId,
                'payment_no'      => 'CCP-2026-00017',
                'amount'          => 185300.00,
                'due_date'        => '2026-04-20',
                'statement_date'  => '2026-03-25',
                'payment_date'    => '2026-04-17',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-04-08 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-04-10 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-04-17 11:00:00',
                'remarks'         => 'Mar 2026 — ANA x10 ICN, Lotte Hotel Seoul deposit.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $mbtcId,
                'payment_no'      => 'CCP-2026-00018',
                'amount'          => 196550.00,
                'due_date'        => '2026-05-20',
                'statement_date'  => '2026-04-25',
                'payment_date'    => '2026-05-17',
                'status'          => 'paid',
                'approval_status' => 'released',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-05-08 09:00:00',
                'approved_by'     => $coo,
                'approved_at'     => '2026-05-10 10:00:00',
                'released_by'     => $accounting,
                'released_at'     => '2026-05-17 11:00:00',
                'remarks'         => 'Apr 2026 — Garuda Bali x15, Alaya Resort deposit (USD 4,200 converted).',
            ]),

            // ── Metrobank Travel Platinum — IN PROGRESS ───────────────────────

            array_merge($base, [
                'credit_card_id'  => $mbtcId,
                'payment_no'      => 'CCP-2026-00019',
                'amount'          => 224800.00,
                'due_date'        => '2026-06-20',
                'statement_date'  => '2026-05-25',
                'status'          => 'pending',
                'approval_status' => 'checked',
                'checked_by'      => $accounting,
                'checked_at'      => '2026-06-08 09:00:00',
                'remarks'         => 'May 2026 statement — VN Airlines advance booking + Osaka hotel deposit.',
                'audit_remarks'   => 'Verified USD charges for Osaka hotel. All receipts filed. Awaiting approval.',
            ]),

            array_merge($base, [
                'credit_card_id'  => $mbtcId,
                'payment_no'      => 'CCP-2026-00020',
                'amount'          => 178900.00,
                'due_date'        => '2026-07-20',
                'statement_date'  => '2026-06-25',
                'status'          => 'pending',
                'approval_status' => 'pending',
                'remarks'         => 'Jun 2026 statement — for review once cut-off is reached.',
            ]),
        ];

        foreach ($payments as $p) {
            DB::table('credit_card_payments')->insert($p);
        }
    }
}
