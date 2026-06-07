<?php

namespace Modules\OrmocBranch\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrmocBranchDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ormoc = DB::table('branches')->where('code', 'ORMOC')->value('id');
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');

        $ormocUser = DB::table('users')->where('email', 'ormoc@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');

        $bookings = [
            [
                'agent_code' => 'AM', 'date' => '2026-01-10', 'client_name' => 'Josefa Rodriguez',
                'contact_number' => '09175552001', 'email' => null,
                'booking_type' => 'domestic', 'destination' => 'Cebu City',
                'travel_date' => '2026-01-25', 'pax_count' => 2,
                'hotel' => 'Radisson Blu Cebu', 'room_type' => 'Deluxe',
                'flight_details' => 'Cebu Pacific 5J-401', 'inclusions' => 'Hotel, Airport Transfer',
                'selling_price' => 18000.00, 'net_payable' => 14400.00, 'income' => 3600.00,
                'mode_of_payment' => 'cash', 'status' => 'confirmed',
                'po_number' => null, 'si_number' => 'SI-O-2026-001', 'or_number' => 'OR-O-2026-001',
                'forwarded_to_accounting' => true, 'forwarded_to_accounting_at' => '2026-01-15 14:00:00',
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'LB', 'date' => '2026-01-20', 'client_name' => 'Socorro Bautista',
                'contact_number' => '09175552002', 'email' => null,
                'booking_type' => 'domestic', 'destination' => 'Manila',
                'travel_date' => '2026-02-05', 'pax_count' => 1,
                'hotel' => null, 'room_type' => null,
                'flight_details' => 'Cebu Pacific 5J-502', 'inclusions' => 'Flight only',
                'selling_price' => 5500.00, 'net_payable' => 4400.00, 'income' => 1100.00,
                'mode_of_payment' => 'cash', 'status' => 'confirmed',
                'po_number' => null, 'si_number' => 'SI-O-2026-002', 'or_number' => 'OR-O-2026-002',
                'forwarded_to_accounting' => true, 'forwarded_to_accounting_at' => '2026-01-25 14:00:00',
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'RD', 'date' => '2026-02-01', 'client_name' => 'Hilario Tan',
                'contact_number' => '09175552003', 'email' => 'hilario@tanco.com',
                'booking_type' => 'international', 'destination' => 'Tokyo, Japan',
                'travel_date' => '2026-03-15', 'pax_count' => 4,
                'hotel' => 'Hotel Gracery Shinjuku', 'room_type' => 'Twin',
                'flight_details' => 'Philippine Airlines PR-432', 'inclusions' => 'Flight, Hotel, Tours',
                'selling_price' => 120000.00, 'net_payable' => 96000.00, 'income' => 24000.00,
                'mode_of_payment' => 'bank_transfer', 'status' => 'confirmed',
                'po_number' => 'PO-HT-001', 'si_number' => 'SI-O-2026-003', 'or_number' => null,
                'escalated_to_head_office' => true, 'escalated_at' => '2026-02-03 09:00:00',
                'escalated_by' => $ormocUser,
                'po_sent_to_mariposa' => true, 'po_sent_to_mariposa_at' => '2026-02-04 10:00:00',
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'KP', 'date' => '2026-02-15', 'client_name' => 'Pedro Villanueva',
                'contact_number' => '09175552004', 'email' => null,
                'booking_type' => 'domestic', 'destination' => 'Bohol',
                'travel_date' => '2026-03-01', 'pax_count' => 6,
                'hotel' => 'Bohol Tropics Resort', 'room_type' => 'Family',
                'flight_details' => 'Cebu Pacific 5J-421', 'inclusions' => 'Hotel, Tours, Transfers',
                'selling_price' => 42000.00, 'net_payable' => 33600.00, 'income' => 8400.00,
                'mode_of_payment' => 'cash', 'status' => 'confirmed',
                'po_number' => null, 'si_number' => 'SI-O-2026-004', 'or_number' => 'OR-O-2026-004',
                'forwarded_to_accounting' => true, 'forwarded_to_accounting_at' => '2026-02-20 14:00:00',
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'AM', 'date' => '2026-03-10', 'client_name' => 'Lourdes Gonzalez',
                'contact_number' => '09175552005', 'email' => null,
                'booking_type' => 'domestic', 'destination' => 'Davao',
                'travel_date' => '2026-04-01', 'pax_count' => 3,
                'hotel' => 'The Pinnacle Davao', 'room_type' => 'Standard',
                'flight_details' => 'Philippine Airlines PR-818', 'inclusions' => 'Flight, Hotel',
                'selling_price' => 28000.00, 'net_payable' => 22400.00, 'income' => 5600.00,
                'mode_of_payment' => 'bank_transfer', 'status' => 'inquiry',
                'po_number' => null, 'si_number' => null, 'or_number' => null,
                'forwarded_to_accounting' => false,
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'LB', 'date' => '2026-04-01', 'client_name' => 'Ricardo Mendoza',
                'contact_number' => '09175552006', 'email' => null,
                'booking_type' => 'international', 'destination' => 'Seoul, Korea',
                'travel_date' => '2026-05-15', 'pax_count' => 2,
                'hotel' => 'Lotte Hotel Seoul', 'room_type' => 'Superior',
                'flight_details' => 'Korean Air KE-632', 'inclusions' => 'Flight, Hotel, Airport Transfer',
                'selling_price' => 65000.00, 'net_payable' => 52000.00, 'income' => 13000.00,
                'mode_of_payment' => 'credit_card', 'status' => 'quoted',
                'po_number' => null, 'si_number' => 'SI-O-2026-006', 'or_number' => null,
                'cc_surcharge_applied' => true,
                'escalated_to_head_office' => true, 'escalated_at' => '2026-04-03 09:00:00',
                'escalated_by' => $ormocUser,
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'MMT', 'date' => '2026-04-15', 'client_name' => 'Mercy Fernandez',
                'contact_number' => '09175552007', 'email' => null,
                'booking_type' => 'domestic', 'destination' => 'Siargao',
                'travel_date' => '2026-05-10', 'pax_count' => 2,
                'hotel' => 'Siargao Bleu Resort', 'room_type' => 'Deluxe',
                'flight_details' => 'Cebu Pacific 5J-472', 'inclusions' => 'Hotel, Surfing lessons',
                'selling_price' => 22000.00, 'net_payable' => 17600.00, 'income' => 4400.00,
                'mode_of_payment' => 'cash', 'status' => 'cancelled',
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'notes' => 'Client requested cancellation - personal reasons',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'agent_code' => 'RD', 'date' => '2026-05-01', 'client_name' => 'Marissa Aquino',
                'contact_number' => '09175552008', 'email' => 'marissa@aquino.com',
                'booking_type' => 'international', 'destination' => 'Singapore',
                'travel_date' => '2026-06-10', 'pax_count' => 5,
                'hotel' => 'Marina Bay Sands', 'room_type' => 'Premier',
                'flight_details' => 'Singapore Airlines SQ-911', 'inclusions' => 'Flight, Hotel, City Tour',
                'selling_price' => 150000.00, 'net_payable' => 120000.00, 'income' => 30000.00,
                'mode_of_payment' => 'bank_transfer', 'status' => 'inquiry',
                'po_number' => null, 'si_number' => null, 'or_number' => null,
                'escalated_to_head_office' => true, 'escalated_at' => '2026-05-02 09:00:00',
                'escalated_by' => $ormocUser,
                'branch_id' => $ormoc, 'created_by' => $ormocUser, 'updated_by' => $ormocUser,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($bookings as $b) {
            DB::table('ormoc_bookings')->insert($b);
        }
    }
}
