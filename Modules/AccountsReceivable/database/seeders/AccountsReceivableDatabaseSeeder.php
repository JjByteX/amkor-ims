<?php

namespace Modules\AccountsReceivable\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountsReceivableDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');
        $ormoc = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $jhona = DB::table('users')->where('email', 'jhona@amkor.ph')->value('id');
        $visa = DB::table('users')->where('email', 'visa@amkor.ph')->value('id');
        $ormocUser = DB::table('users')->where('email', 'ormoc@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');
        $gsm = DB::table('users')->where('email', 'gsm@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');

        $contactMariposa = DB::table('contacts')->where('name', 'Mariposa Travel Agency')->value('id');
        $contactBdo = DB::table('contacts')->where('name', 'BDO Unibank')->where('currency', 'PHP')->value('id');

        $collectibles = [
            [
                'department' => 'resa', 'agent_code' => 'RT', 'date' => '2026-01-10',
                'contact_id' => $contactMariposa, 'customer_name' => 'Manila Solutions Corp.',
                'corporate_account' => 'Manila Solutions Corp.', 'particulars' => 'Bangkok team building package',
                'travel_date' => '2026-02-15', 'terms' => 'Net 30',
                'collectible_amount_php' => 85000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 85000.00, 'payment_received_usd' => 0,
                'balance_php' => 0, 'balance_usd' => 0,
                'due_date' => '2026-02-01', 'days_outstanding' => 0, 'status' => 'paid',
                'approval_status' => 'approved', 'approved_by_coo' => $coo, 'approved_by_coo_at' => '2026-01-12 10:00:00',
                'approved_by_gsm' => $gsm, 'approved_by_gsm_at' => '2026-01-12 14:00:00',
                'or_number' => 'OR-AR-2026-001', 'branch_id' => $qcMain,
                'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'resa', 'agent_code' => 'MMT', 'date' => '2026-02-01',
                'contact_id' => $contactBdo, 'customer_name' => 'Philippine Tech Inc.',
                'corporate_account' => 'Philippine Tech Inc.', 'particulars' => 'Singapore company retreat',
                'travel_date' => '2026-03-10', 'terms' => 'Net 30',
                'collectible_amount_php' => 180000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 100000.00, 'payment_received_usd' => 0,
                'balance_php' => 80000.00, 'balance_usd' => 0,
                'due_date' => '2026-03-01', 'days_outstanding' => 68, 'status' => 'overdue',
                'approval_status' => 'pending',
                'or_number' => null, 'branch_id' => $qcMain,
                'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'resa', 'agent_code' => 'JHONA', 'date' => '2026-03-01',
                'contact_id' => null, 'customer_name' => 'Juan Dela Cruz',
                'corporate_account' => null, 'particulars' => 'Cebu weekend getaway',
                'travel_date' => '2026-02-10', 'terms' => 'Net 15',
                'collectible_amount_php' => 25000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 25000.00, 'payment_received_usd' => 0,
                'balance_php' => 0, 'balance_usd' => 0,
                'due_date' => '2026-03-05', 'days_outstanding' => 0, 'status' => 'paid',
                'approval_status' => 'approved', 'approved_by_coo' => $coo, 'approved_by_coo_at' => '2026-03-02 10:00:00',
                'approved_by_gsm' => $gsm, 'approved_by_gsm_at' => '2026-03-02 14:00:00',
                'or_number' => 'OR-AR-2026-003', 'branch_id' => $qcMain,
                'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'visa', 'agent_code' => 'ALEX', 'date' => '2026-01-05',
                'contact_id' => null, 'customer_name' => 'Roberto Aquino',
                'corporate_account' => null, 'particulars' => 'Japan Tourist Visa',
                'travel_date' => null, 'terms' => 'Cash',
                'collectible_amount_php' => 12000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 12000.00, 'payment_received_usd' => 0,
                'balance_php' => 0, 'balance_usd' => 0,
                'due_date' => '2026-01-05', 'days_outstanding' => 0, 'status' => 'paid',
                'approval_status' => 'approved', 'approved_by_coo' => $coo, 'approved_by_coo_at' => '2026-01-06 10:00:00',
                'approved_by_gsm' => $gsm, 'approved_by_gsm_at' => '2026-01-06 14:00:00',
                'or_number' => 'OR-AR-2026-004', 'branch_id' => $visaCentre,
                'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'visa', 'agent_code' => 'KAE', 'date' => '2026-02-10',
                'contact_id' => null, 'customer_name' => 'Carmen Villanueva',
                'corporate_account' => null, 'particulars' => 'Japan Business Visa',
                'travel_date' => null, 'terms' => 'Net 30',
                'collectible_amount_php' => 13000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 0, 'payment_received_usd' => 0,
                'balance_php' => 13000.00, 'balance_usd' => 0,
                'due_date' => '2026-03-10', 'days_outstanding' => 90, 'status' => 'overdue',
                'approval_status' => 'coo_approved', 'approved_by_coo' => $coo, 'approved_by_coo_at' => '2026-02-15 10:00:00',
                'approved_by_gsm' => null, 'approved_by_gsm_at' => null,
                'or_number' => null, 'branch_id' => $visaCentre,
                'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'visa', 'agent_code' => 'RICCI', 'date' => '2026-04-01',
                'contact_id' => null, 'customer_name' => 'Grace Tan',
                'corporate_account' => null, 'particulars' => 'Korea Tourist Visa',
                'travel_date' => null, 'terms' => 'Net 30',
                'collectible_amount_php' => 10000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 0, 'payment_received_usd' => 0,
                'balance_php' => 10000.00, 'balance_usd' => 0,
                'due_date' => '2026-05-01', 'days_outstanding' => 38, 'status' => 'current',
                'approval_status' => 'pending',
                'or_number' => null, 'branch_id' => $visaCentre,
                'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'ormoc', 'agent_code' => 'AM', 'date' => '2026-01-10',
                'contact_id' => null, 'customer_name' => 'Josefa Rodriguez',
                'corporate_account' => null, 'particulars' => 'Cebu City package',
                'travel_date' => '2026-01-25', 'terms' => 'Cash',
                'collectible_amount_php' => 18000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 18000.00, 'payment_received_usd' => 0,
                'balance_php' => 0, 'balance_usd' => 0,
                'due_date' => '2026-01-25', 'days_outstanding' => 0, 'status' => 'paid',
                'approval_status' => 'approved', 'approved_by_coo' => $coo, 'approved_by_coo_at' => '2026-01-15 10:00:00',
                'approved_by_gsm' => $gsm, 'approved_by_gsm_at' => '2026-01-15 14:00:00',
                'or_number' => 'OR-AR-2026-007', 'branch_id' => $ormoc,
                'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'ormoc', 'agent_code' => 'RD', 'date' => '2026-02-01',
                'contact_id' => $contactMariposa, 'customer_name' => 'Hilario Tan',
                'corporate_account' => 'Tanco Corp.', 'particulars' => 'Tokyo international booking',
                'travel_date' => '2026-03-15', 'terms' => 'Net 30',
                'collectible_amount_php' => 120000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 60000.00, 'payment_received_usd' => 0,
                'balance_php' => 60000.00, 'balance_usd' => 0,
                'due_date' => '2026-03-01', 'days_outstanding' => 99, 'status' => 'overdue',
                'approval_status' => 'approved', 'approved_by_coo' => $coo, 'approved_by_coo_at' => '2026-02-10 10:00:00',
                'approved_by_gsm' => $gsm, 'approved_by_gsm_at' => '2026-02-10 14:00:00',
                'or_number' => null, 'branch_id' => $ormoc,
                'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'ormoc', 'agent_code' => 'KP', 'date' => '2026-02-15',
                'contact_id' => null, 'customer_name' => 'Pedro Villanueva',
                'corporate_account' => null, 'particulars' => 'Bohol family package',
                'travel_date' => '2026-03-01', 'terms' => 'Cash',
                'collectible_amount_php' => 42000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 42000.00, 'payment_received_usd' => 0,
                'balance_php' => 0, 'balance_usd' => 0,
                'due_date' => '2026-03-01', 'days_outstanding' => 0, 'status' => 'paid',
                'approval_status' => 'approved', 'approved_by_coo' => $coo, 'approved_by_coo_at' => '2026-02-20 10:00:00',
                'approved_by_gsm' => $gsm, 'approved_by_gsm_at' => '2026-02-20 14:00:00',
                'or_number' => 'OR-AR-2026-009', 'branch_id' => $ormoc,
                'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'department' => 'resa', 'agent_code' => 'RESA', 'date' => '2026-05-01',
                'contact_id' => null, 'customer_name' => 'Global BPO Services',
                'corporate_account' => 'Global BPO Services', 'particulars' => 'Palawan team building',
                'travel_date' => '2026-04-05', 'terms' => 'Net 30',
                'collectible_amount_php' => 225000.00, 'collectible_amount_usd' => 0,
                'payment_received_php' => 0, 'payment_received_usd' => 0,
                'balance_php' => 225000.00, 'balance_usd' => 0,
                'due_date' => '2026-04-01', 'days_outstanding' => 68, 'status' => 'overdue',
                'approval_status' => 'pending',
                'or_number' => null, 'branch_id' => $qcMain,
                'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($collectibles as $c) {
            DB::table('collectibles')->insert($c);
        }
    }
}
