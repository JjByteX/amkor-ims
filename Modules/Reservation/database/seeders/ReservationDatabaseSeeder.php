<?php

namespace Modules\Reservation\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReservationDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $ormoc = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $jhona = DB::table('users')->where('email', 'jhona@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');

        $bookings = [
            [
                'booking_no' => 'RES-2026-001', 'date' => '2026-01-10', 'agent_code' => 'RT',
                'client_name' => 'Manila Solutions Corp.', 'contact_number' => '09175551001',
                'email' => 'info@manilasolutions.com', 'corporate_account' => 'Manila Solutions Corp.',
                'destination' => 'Bangkok, Thailand', 'travel_date' => '2026-02-15', 'return_date' => '2026-02-20',
                'pax_count' => 5, 'service_type' => 'package', 'particulars' => 'Corporate team building trip',
                'selling_price' => 85000.00, 'net_payable' => 68000.00, 'income' => 17000.00,
                'mode_of_payment' => 'bank_transfer', 'payment_due_date' => '2026-02-01',
                'soa_number' => 'SOA-2026-001', 'po_number' => 'PO-MS-001',
                'status' => 'confirmed', 'confirmed_at' => '2026-01-12 10:00:00', 'confirmed_by' => $jhona,
                'forwarded_to_accounting' => true, 'forwarded_to_accounting_at' => '2026-01-15 14:00:00',
                'forwarded_to_accounting_by' => $jhona,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-002', 'date' => '2026-01-20', 'agent_code' => 'JHONA',
                'client_name' => 'Juan Dela Cruz', 'contact_number' => '09175551002',
                'email' => null, 'corporate_account' => null,
                'destination' => 'Cebu', 'travel_date' => '2026-02-10', 'return_date' => '2026-02-12',
                'pax_count' => 2, 'service_type' => 'package', 'particulars' => 'Weekend getaway',
                'selling_price' => 25000.00, 'net_payable' => 20000.00, 'income' => 5000.00,
                'mode_of_payment' => 'cash', 'payment_due_date' => '2026-02-05',
                'soa_number' => null, 'po_number' => null,
                'status' => 'confirmed', 'confirmed_at' => '2026-01-22 09:00:00', 'confirmed_by' => $jhona,
                'forwarded_to_accounting' => true, 'forwarded_to_accounting_at' => '2026-01-25 14:00:00',
                'forwarded_to_accounting_by' => $jhona,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-003', 'date' => '2026-02-01', 'agent_code' => 'MMT',
                'client_name' => 'Philippine Tech Inc.', 'contact_number' => '09175551003',
                'email' => 'travel@phtech.com', 'corporate_account' => 'Philippine Tech Inc.',
                'destination' => 'Singapore', 'travel_date' => '2026-03-10', 'return_date' => '2026-03-15',
                'pax_count' => 8, 'service_type' => 'package', 'particulars' => 'Annual company retreat',
                'selling_price' => 180000.00, 'net_payable' => 144000.00, 'income' => 36000.00,
                'mode_of_payment' => 'bank_transfer', 'payment_due_date' => '2026-03-01',
                'soa_number' => 'SOA-2026-003', 'po_number' => 'PO-PT-003',
                'status' => 'confirmed', 'confirmed_at' => '2026-02-05 10:00:00', 'confirmed_by' => $jhona,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-004', 'date' => '2026-02-15', 'agent_code' => 'RT',
                'client_name' => 'Maria Garcia', 'contact_number' => '09175551004',
                'email' => null, 'corporate_account' => null,
                'destination' => 'Boracay', 'travel_date' => '2026-03-20', 'return_date' => '2026-03-23',
                'pax_count' => 4, 'service_type' => 'package', 'particulars' => 'Family vacation',
                'selling_price' => 48000.00, 'net_payable' => 38400.00, 'income' => 9600.00,
                'mode_of_payment' => 'credit_card', 'payment_due_date' => '2026-03-15',
                'soa_number' => null, 'po_number' => null,
                'status' => 'inquiry', 'confirmed_at' => null, 'confirmed_by' => null,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-005', 'date' => '2026-03-01', 'agent_code' => 'RESA',
                'client_name' => 'Global BPO Services', 'contact_number' => '09175551005',
                'email' => 'hr@globalbpo.com', 'corporate_account' => 'Global BPO Services',
                'destination' => 'Palawan', 'travel_date' => '2026-04-05', 'return_date' => '2026-04-08',
                'pax_count' => 15, 'service_type' => 'package', 'particulars' => 'Team building - Palawan tour',
                'selling_price' => 225000.00, 'net_payable' => 180000.00, 'income' => 45000.00,
                'mode_of_payment' => 'bank_transfer', 'payment_due_date' => '2026-04-01',
                'soa_number' => 'SOA-2026-005', 'po_number' => 'PO-GB-005',
                'status' => 'quoted', 'confirmed_at' => null, 'confirmed_by' => null,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-006', 'date' => '2026-03-10', 'agent_code' => 'JHONA',
                'client_name' => 'Ana Santos', 'contact_number' => '09175551006',
                'email' => null, 'corporate_account' => null,
                'destination' => 'Siargao', 'travel_date' => '2026-04-15', 'return_date' => '2026-04-18',
                'pax_count' => 3, 'service_type' => 'package', 'particulars' => 'Surfing trip',
                'selling_price' => 35000.00, 'net_payable' => 28000.00, 'income' => 7000.00,
                'mode_of_payment' => 'cash', 'payment_due_date' => '2026-04-10',
                'soa_number' => null, 'po_number' => null,
                'status' => 'inquiry', 'confirmed_at' => null, 'confirmed_by' => null,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-007', 'date' => '2026-04-01', 'agent_code' => 'MMT',
                'client_name' => 'Metro Bank employees', 'contact_number' => '09175551007',
                'email' => 'travel@metrobank.com', 'corporate_account' => 'Metro Bank',
                'destination' => 'Hong Kong', 'travel_date' => '2026-05-10', 'return_date' => '2026-05-14',
                'pax_count' => 10, 'service_type' => 'ticketing', 'particulars' => 'Flight-only bookings',
                'selling_price' => 150000.00, 'net_payable' => 135000.00, 'income' => 15000.00,
                'mode_of_payment' => 'bank_transfer', 'payment_due_date' => '2026-05-01',
                'soa_number' => 'SOA-2026-007', 'po_number' => 'PO-MB-007',
                'status' => 'cancelled', 'confirmed_at' => null, 'confirmed_by' => null,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'remarks' => 'Client cancelled due to schedule conflict',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-008', 'date' => '2026-04-15', 'agent_code' => 'RT',
                'client_name' => 'David Reyes', 'contact_number' => '09175551008',
                'email' => null, 'corporate_account' => null,
                'destination' => 'Tagaytay', 'travel_date' => '2026-05-01', 'return_date' => '2026-05-02',
                'pax_count' => 6, 'service_type' => 'transfer', 'particulars' => 'Airport transfer + hotel',
                'selling_price' => 18000.00, 'net_payable' => 14400.00, 'income' => 3600.00,
                'mode_of_payment' => 'cash', 'payment_due_date' => '2026-04-28',
                'soa_number' => null, 'po_number' => null,
                'status' => 'inquiry', 'confirmed_at' => null, 'confirmed_by' => null,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-009', 'date' => '2026-05-01', 'agent_code' => 'JHONA',
                'client_name' => 'Sarah Lopez', 'contact_number' => '09175551009',
                'email' => null, 'corporate_account' => null,
                'destination' => 'Baguio', 'travel_date' => '2026-05-20', 'return_date' => '2026-05-22',
                'pax_count' => 2, 'service_type' => 'hotel', 'particulars' => 'Hotel-only booking',
                'selling_price' => 12000.00, 'net_payable' => 10000.00, 'income' => 2000.00,
                'mode_of_payment' => 'credit_card', 'payment_due_date' => '2026-05-15',
                'soa_number' => null, 'po_number' => null,
                'status' => 'quoted', 'confirmed_at' => null, 'confirmed_by' => null,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $qcMain, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'booking_no' => 'RES-2026-010', 'date' => '2026-05-10', 'agent_code' => 'RESA',
                'client_name' => 'Ormoc Govt Office', 'contact_number' => '09175551010',
                'email' => 'travel@ormoc.gov.ph', 'corporate_account' => 'Ormoc City Government',
                'destination' => 'Manila', 'travel_date' => '2026-06-01', 'return_date' => '2026-06-03',
                'pax_count' => 4, 'service_type' => 'package', 'particulars' => 'Official travel',
                'selling_price' => 52000.00, 'net_payable' => 41600.00, 'income' => 10400.00,
                'mode_of_payment' => 'bank_transfer', 'payment_due_date' => '2026-05-28',
                'soa_number' => 'SOA-2026-010', 'po_number' => 'PO-OC-010',
                'status' => 'inquiry', 'confirmed_at' => null, 'confirmed_by' => null,
                'forwarded_to_accounting' => false, 'forwarded_to_accounting_at' => null,
                'forwarded_to_accounting_by' => null,
                'branch_id' => $ormoc, 'created_by' => $jhona, 'updated_by' => $jhona,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($bookings as $b) {
            DB::table('reservation_bookings')->updateOrInsert(
                ['booking_no' => $b['booking_no']],
                $b
            );
        }
    }
}
