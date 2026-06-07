<?php

namespace Modules\BirCompliance\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BirComplianceDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');
        $ormoc = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $dalle = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');

        $transactions = [
            [
                'source_type' => 'booking', 'source_id' => null,
                'document_type' => 'SOA', 'document_number' => 'SOA-2026-001',
                'client_name' => 'Manila Solutions Corp.', 'tin' => '287-123-456-000',
                'address' => 'Makati City', 'business_style' => 'IT Solutions',
                'gross_amount' => 85000.00, 'vatable_sales' => 75892.86, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 9107.14,
                'total_sales_vat_inclusive' => 85000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 85000.00,
                'mode_of_payment' => 'bank_transfer', 'check_number' => null,
                'transaction_date' => '2026-01-10', 'due_date' => '2026-02-01',
                'year' => 2026, 'month' => 1, 'branch_code' => 'QC_MAIN',
                'branch_id' => $qcMain, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'visa', 'source_id' => null,
                'document_type' => 'SI', 'document_number' => 'SI-V-2026-001',
                'client_name' => 'Roberto Aquino', 'tin' => null,
                'address' => 'Quezon City', 'business_style' => null,
                'gross_amount' => 12000.00, 'vatable_sales' => 10714.29, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 1285.71,
                'total_sales_vat_inclusive' => 12000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 12000.00,
                'mode_of_payment' => 'cash', 'check_number' => null,
                'transaction_date' => '2026-01-05', 'due_date' => null,
                'year' => 2026, 'month' => 1, 'branch_code' => 'VISA_CENTRE',
                'branch_id' => $visaCentre, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'ormoc', 'source_id' => null,
                'document_type' => 'SI', 'document_number' => 'SI-O-2026-001',
                'client_name' => 'Josefa Rodriguez', 'tin' => null,
                'address' => 'Ormoc City', 'business_style' => null,
                'gross_amount' => 18000.00, 'vatable_sales' => 16071.43, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 1928.57,
                'total_sales_vat_inclusive' => 18000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 18000.00,
                'mode_of_payment' => 'cash', 'check_number' => null,
                'transaction_date' => '2026-01-10', 'due_date' => null,
                'year' => 2026, 'month' => 1, 'branch_code' => 'ORMOC',
                'branch_id' => $ormoc, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'booking', 'source_id' => null,
                'document_type' => 'SOA', 'document_number' => 'SOA-2026-003',
                'client_name' => 'Philippine Tech Inc.', 'tin' => '287-987-654-000',
                'address' => 'BGC, Taguig', 'business_style' => 'Technology Solutions',
                'gross_amount' => 180000.00, 'vatable_sales' => 160714.29, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 19285.71,
                'total_sales_vat_inclusive' => 180000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 180000.00,
                'mode_of_payment' => 'bank_transfer', 'check_number' => null,
                'transaction_date' => '2026-02-01', 'due_date' => '2026-03-01',
                'year' => 2026, 'month' => 2, 'branch_code' => 'QC_MAIN',
                'branch_id' => $qcMain, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'visa', 'source_id' => null,
                'document_type' => 'SI', 'document_number' => 'SI-V-2026-004',
                'client_name' => 'Carmen Villanueva', 'tin' => null,
                'address' => 'Pasig City', 'business_style' => null,
                'gross_amount' => 13000.00, 'vatable_sales' => 11607.14, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 1392.86,
                'total_sales_vat_inclusive' => 13000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 13000.00,
                'mode_of_payment' => 'bpi', 'check_number' => null,
                'transaction_date' => '2026-02-10', 'due_date' => '2026-03-10',
                'year' => 2026, 'month' => 2, 'branch_code' => 'VISA_CENTRE',
                'branch_id' => $visaCentre, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'collectible', 'source_id' => null,
                'document_type' => 'AR', 'document_number' => 'AR-2026-003',
                'client_name' => 'Juan Dela Cruz', 'tin' => null,
                'address' => 'Manila', 'business_style' => null,
                'gross_amount' => 25000.00, 'vatable_sales' => 22321.43, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 2678.57,
                'total_sales_vat_inclusive' => 25000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 25000.00,
                'mode_of_payment' => 'cash', 'check_number' => null,
                'transaction_date' => '2026-03-01', 'due_date' => null,
                'year' => 2026, 'month' => 3, 'branch_code' => 'QC_MAIN',
                'branch_id' => $qcMain, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'booking', 'source_id' => null,
                'document_type' => 'SOA', 'document_number' => 'SOA-2026-005',
                'client_name' => 'Global BPO Services', 'tin' => '287-444-555-000',
                'address' => 'Ortigas, Pasig', 'business_style' => 'BPO Services',
                'gross_amount' => 225000.00, 'vatable_sales' => 200892.86, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 24107.14,
                'total_sales_vat_inclusive' => 225000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 225000.00,
                'mode_of_payment' => 'bank_transfer', 'check_number' => null,
                'transaction_date' => '2026-03-01', 'due_date' => '2026-04-01',
                'year' => 2026, 'month' => 3, 'branch_code' => 'QC_MAIN',
                'branch_id' => $qcMain, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'ormoc', 'source_id' => null,
                'document_type' => 'SI', 'document_number' => 'SI-O-2026-003',
                'client_name' => 'Hilario Tan', 'tin' => null,
                'address' => 'Ormoc City', 'business_style' => null,
                'gross_amount' => 120000.00, 'vatable_sales' => 107142.86, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 12857.14,
                'total_sales_vat_inclusive' => 120000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 120000.00,
                'mode_of_payment' => 'bank_transfer', 'check_number' => null,
                'transaction_date' => '2026-02-01', 'due_date' => '2026-03-01',
                'year' => 2026, 'month' => 2, 'branch_code' => 'ORMOC',
                'branch_id' => $ormoc, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'visa', 'source_id' => null,
                'document_type' => 'SI', 'document_number' => 'SI-V-2026-007',
                'client_name' => 'Francis Mendoza', 'tin' => null,
                'address' => 'Mandaluyong', 'business_style' => null,
                'gross_amount' => 12000.00, 'vatable_sales' => 10714.29, 'vat_exempt_sales' => 0,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 1285.71,
                'total_sales_vat_inclusive' => 12000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 12000.00,
                'mode_of_payment' => 'cash', 'check_number' => null,
                'transaction_date' => '2026-03-15', 'due_date' => null,
                'year' => 2026, 'month' => 3, 'branch_code' => 'VISA_CENTRE',
                'branch_id' => $visaCentre, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'source_type' => 'booking', 'source_id' => null,
                'document_type' => 'SOA', 'document_number' => 'SOA-2026-010',
                'client_name' => 'Ormoc Govt Office', 'tin' => '287-666-777-000',
                'address' => 'Ormoc City', 'business_style' => 'Government',
                'gross_amount' => 52000.00, 'vatable_sales' => 0, 'vat_exempt_sales' => 52000.00,
                'vat_zero_rated_sales' => 0, 'vat_amount' => 0,
                'total_sales_vat_inclusive' => 52000.00, 'sc_pwd_discount' => 0,
                'withholding_tax' => 0, 'net_amount_due' => 52000.00,
                'mode_of_payment' => 'bank_transfer', 'check_number' => null,
                'transaction_date' => '2026-05-10', 'due_date' => '2026-05-28',
                'year' => 2026, 'month' => 5, 'branch_code' => 'ORMOC',
                'branch_id' => $ormoc, 'created_by' => $accounting, 'updated_by' => $accounting,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($transactions as $t) {
            DB::table('bir_transactions')->insert($t);
        }
    }
}
