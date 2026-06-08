<?php

namespace Modules\Visa\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VisaDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');

        $visa = DB::table('users')->where('email', 'visa@amkor.ph')->value('id');
        $liaison = DB::table('users')->where('email', 'liaison@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');

        $applications = [
            [
                'agent_code' => 'ALEX', 'date' => '2026-01-05', 'agency' => null,
                'customer_name' => 'Roberto Aquino', 'visa_type' => 'Japan Tourist Visa',
                'selling_price' => 12000.00, 'net_payable' => 8500.00, 'income' => 3500.00,
                'status' => 'completed', 'mode_of_payment' => 'cash', 'payment_date' => '2026-01-05',
                'soa_number' => null, 'si_number' => 'SI-V-2026-001', 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => 'OR-2026-001', 'or_received_at' => '2026-01-10 10:00:00',
                'or_endorsed_at' => '2026-01-11 14:00:00', 'or_endorsed_by' => $liaison,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'RICCI', 'date' => '2026-01-15', 'agency' => null,
                'customer_name' => 'Patricia Cruz', 'visa_type' => 'Korea Tourist Visa',
                'selling_price' => 10000.00, 'net_payable' => 7000.00, 'income' => 3000.00,
                'status' => 'completed', 'mode_of_payment' => 'bdo', 'payment_date' => '2026-01-15',
                'soa_number' => 'SOA-V-2026-002', 'si_number' => 'SI-V-2026-002', 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => 'OR-2026-002', 'or_received_at' => '2026-01-20 10:00:00',
                'or_endorsed_at' => '2026-01-21 14:00:00', 'or_endorsed_by' => $liaison,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'MEL', 'date' => '2026-02-01', 'agency' => null,
                'customer_name' => 'Angelo Bautista', 'visa_type' => 'US Tourist Visa (B1/B2)',
                'selling_price' => 15000.00, 'net_payable' => 10500.00, 'income' => 4500.00,
                'status' => 'on_process', 'mode_of_payment' => 'cash', 'payment_date' => '2026-02-01',
                'soa_number' => null, 'si_number' => 'SI-V-2026-003', 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => null, 'or_received_at' => null,
                'or_endorsed_at' => null, 'or_endorsed_by' => null,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'KAE', 'date' => '2026-02-10', 'agency' => null,
                'customer_name' => 'Carmen Villanueva', 'visa_type' => 'Japan Business Visa',
                'selling_price' => 13000.00, 'net_payable' => 9100.00, 'income' => 3900.00,
                'status' => 'on_process', 'mode_of_payment' => 'bpi', 'payment_date' => '2026-02-10',
                'soa_number' => 'SOA-V-2026-004', 'si_number' => 'SI-V-2026-004', 'ar_number' => null,
                'payment_due_date' => '2026-03-10', 'payment_request_sent' => true,
                'payment_request_sent_at' => '2026-02-20 09:00:00',
                'or_number' => null, 'or_received_at' => null,
                'or_endorsed_at' => null, 'or_endorsed_by' => null,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'MIMI', 'date' => '2026-02-20', 'agency' => null,
                'customer_name' => 'Emmanuel Garcia', 'visa_type' => 'Schengen Tourist Visa',
                'selling_price' => 18000.00, 'net_payable' => 12600.00, 'income' => 5400.00,
                'status' => 'pending', 'mode_of_payment' => null, 'payment_date' => null,
                'soa_number' => null, 'si_number' => null, 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => null, 'or_received_at' => null,
                'or_endorsed_at' => null, 'or_endorsed_by' => null,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'MMT', 'date' => '2026-03-01', 'agency' => null,
                'customer_name' => 'Liza Ramos', 'visa_type' => 'Australia Tourist Visa',
                'selling_price' => 14000.00, 'net_payable' => 9800.00, 'income' => 4200.00,
                'status' => 'completed', 'mode_of_payment' => 'cash', 'payment_date' => '2026-03-01',
                'soa_number' => null, 'si_number' => 'SI-V-2026-006', 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => 'OR-2026-006', 'or_received_at' => '2026-03-05 10:00:00',
                'or_endorsed_at' => '2026-03-06 14:00:00', 'or_endorsed_by' => $liaison,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'ALEX', 'date' => '2026-03-15', 'agency' => null,
                'customer_name' => 'Francis Mendoza', 'visa_type' => 'Japan Tourist Visa',
                'selling_price' => 12000.00, 'net_payable' => 8500.00, 'income' => 3500.00,
                'status' => 'approved', 'mode_of_payment' => 'cash', 'payment_date' => '2026-03-15',
                'soa_number' => null, 'si_number' => 'SI-V-2026-007', 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => 'OR-2026-007', 'or_received_at' => '2026-03-20 10:00:00',
                'or_endorsed_at' => '2026-03-21 14:00:00', 'or_endorsed_by' => $liaison,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'RICCI', 'date' => '2026-04-01', 'agency' => null,
                'customer_name' => 'Grace Tan', 'visa_type' => 'Korea Tourist Visa',
                'selling_price' => 10000.00, 'net_payable' => 7000.00, 'income' => 3000.00,
                'status' => 'on_process', 'mode_of_payment' => 'check', 'payment_date' => '2026-04-01',
                'soa_number' => 'SOA-V-2026-008', 'si_number' => 'SI-V-2026-008', 'ar_number' => 'AR-V-2026-008',
                'payment_due_date' => '2026-05-01', 'payment_request_sent' => true,
                'payment_request_sent_at' => '2026-04-10 09:00:00',
                'or_number' => null, 'or_received_at' => null,
                'or_endorsed_at' => null, 'or_endorsed_by' => null,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'MEL', 'date' => '2026-04-15', 'agency' => null,
                'customer_name' => 'Daniel Lim', 'visa_type' => 'Canada Tourist Visa',
                'selling_price' => 16000.00, 'net_payable' => 11200.00, 'income' => 4800.00,
                'status' => 'denied', 'mode_of_payment' => 'cash', 'payment_date' => '2026-04-15',
                'soa_number' => null, 'si_number' => 'SI-V-2026-009', 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => null, 'or_received_at' => null,
                'or_endorsed_at' => null, 'or_endorsed_by' => null,
                'notes' => 'Visa application denied by embassy',
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'KAE', 'date' => '2026-05-01', 'agency' => null,
                'customer_name' => 'Michelle Santos', 'visa_type' => 'Japan Tourist Visa',
                'selling_price' => 12000.00, 'net_payable' => 8500.00, 'income' => 3500.00,
                'status' => 'pending', 'mode_of_payment' => null, 'payment_date' => null,
                'soa_number' => null, 'si_number' => null, 'ar_number' => null,
                'payment_due_date' => null, 'payment_request_sent' => false,
                'or_number' => null, 'or_received_at' => null,
                'or_endorsed_at' => null, 'or_endorsed_by' => null,
                'branch_id' => $visaCentre, 'created_by' => $visa, 'updated_by' => $visa,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($applications as $a) {
            DB::table('visa_applications')->insert($a);
        }
    }
}
