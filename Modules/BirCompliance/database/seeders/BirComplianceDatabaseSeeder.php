<?php

namespace Modules\BirCompliance\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BirComplianceDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now        = now();
        $qcMain     = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');
        $ormoc      = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $dalle      = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');

        // Helper: build a standard vatable SI/AR row
        $si = function (
            string $docNo, string $client, ?string $tin, string $address,
            float $gross, string $mode, string $date, int $month,
            string $branchCode, int $branchId, ?string $bStyle = null,
            string $sourceType = 'booking'
        ) use ($accounting, $now): array {
            $vatable = round($gross / 1.12, 2);
            $vat     = round($gross - $vatable, 2);
            return [
                'source_type'              => $sourceType,
                'source_id'                => null,
                'document_type'            => 'SI',
                'document_number'          => $docNo,
                'client_name'              => $client,
                'tin'                      => $tin,
                'address'                  => $address,
                'business_style'           => $bStyle,
                'gross_amount'             => $gross,
                'vatable_sales'            => $vatable,
                'vat_exempt_sales'         => 0,
                'vat_zero_rated_sales'     => 0,
                'vat_amount'               => $vat,
                'total_sales_vat_inclusive'=> $gross,
                'sc_pwd_discount'          => 0,
                'withholding_tax'          => 0,
                'net_amount_due'           => $gross,
                'mode_of_payment'          => $mode,
                'check_number'             => null,
                'transaction_date'         => $date,
                'due_date'                 => null,
                'year'                     => 2026,
                'month'                    => $month,
                'branch_code'              => $branchCode,
                'branch_id'                => $branchId,
                'pdf_generated'            => false,
                'created_by'               => $accounting,
                'updated_by'               => $accounting,
                'created_at'               => $now,
                'updated_at'               => $now,
            ];
        };

        $ar = function (
            string $docNo, string $client, ?string $tin, string $address,
            float $gross, string $mode, string $date, int $month,
            string $branchCode, int $branchId, ?string $bStyle = null
        ) use ($accounting, $now): array {
            $vatable = round($gross / 1.12, 2);
            $vat     = round($gross - $vatable, 2);
            return [
                'source_type'              => 'collectible',
                'source_id'                => null,
                'document_type'            => 'AR',
                'document_number'          => $docNo,
                'client_name'              => $client,
                'tin'                      => $tin,
                'address'                  => $address,
                'business_style'           => $bStyle,
                'gross_amount'             => $gross,
                'vatable_sales'            => $vatable,
                'vat_exempt_sales'         => 0,
                'vat_zero_rated_sales'     => 0,
                'vat_amount'               => $vat,
                'total_sales_vat_inclusive'=> $gross,
                'sc_pwd_discount'          => 0,
                'withholding_tax'          => round($gross * 0.02, 2),
                'net_amount_due'           => round($gross - ($gross * 0.02), 2),
                'mode_of_payment'          => $mode,
                'check_number'             => null,
                'transaction_date'         => $date,
                'due_date'                 => null,
                'year'                     => 2026,
                'month'                    => $month,
                'branch_code'              => $branchCode,
                'branch_id'                => $branchId,
                'pdf_generated'            => false,
                'created_by'               => $accounting,
                'updated_by'               => $accounting,
                'created_at'               => $now,
                'updated_at'               => $now,
            ];
        };

        $soa = function (
            string $docNo, string $client, ?string $tin, string $address,
            float $gross, string $mode, string $date, string $due,
            int $month, string $branchCode, int $branchId, ?string $bStyle = null,
            bool $vatExempt = false
        ) use ($accounting, $now): array {
            $vatable = $vatExempt ? 0 : round($gross / 1.12, 2);
            $vat     = $vatExempt ? 0 : round($gross - $vatable, 2);
            $exempt  = $vatExempt ? $gross : 0;
            return [
                'source_type'              => 'booking',
                'source_id'                => null,
                'document_type'            => 'SOA',
                'document_number'          => $docNo,
                'client_name'              => $client,
                'tin'                      => $tin,
                'address'                  => $address,
                'business_style'           => $bStyle,
                'gross_amount'             => $gross,
                'vatable_sales'            => $vatable,
                'vat_exempt_sales'         => $exempt,
                'vat_zero_rated_sales'     => 0,
                'vat_amount'               => $vat,
                'total_sales_vat_inclusive'=> $gross,
                'sc_pwd_discount'          => 0,
                'withholding_tax'          => 0,
                'net_amount_due'           => $gross,
                'mode_of_payment'          => $mode,
                'check_number'             => null,
                'transaction_date'         => $date,
                'due_date'                 => $due,
                'year'                     => 2026,
                'month'                    => $month,
                'branch_code'              => $branchCode,
                'branch_id'                => $branchId,
                'pdf_generated'            => false,
                'created_by'               => $accounting,
                'updated_by'               => $accounting,
                'created_at'               => $now,
                'updated_at'               => $now,
            ];
        };

        $transactions = [

            // ── JANUARY ──────────────────────────────────────────────────────
            $soa('SOA-2026-001', 'Manila Solutions Corp.',     '287-123-456-000', 'Makati City',         85000,  'bank_transfer', '2026-01-10', '2026-02-10', 1, 'QC_MAIN',     $qcMain,     'IT Solutions'),
            $si ('SI-2026-001',  'Roberto Aquino',              null,              'Quezon City',         12000,  'cash',          '2026-01-05', 1, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $si ('SI-O-001',     'Josefa Rodriguez',            null,              'Ormoc City',          18000,  'cash',          '2026-01-10', 1, 'ORMOC',       $ormoc),
            $ar ('AR-2026-001',  'Juan Dela Cruz',              null,              'Manila',              25000,  'cash',          '2026-01-15', 1, 'QC_MAIN',     $qcMain),
            $soa('SOA-2026-002', 'BPO Innovations Inc.',       '287-234-567-000', 'Pasig City',         120000,  'bank_transfer', '2026-01-18', '2026-02-18', 1, 'QC_MAIN',     $qcMain,     'BPO Services'),
            $si ('SI-2026-002',  'Patricia Cruz',               null,              'Mandaluyong',         10000,  'bdo',           '2026-01-20', 1, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $si ('SI-O-002',     'Socorro Bautista',            null,              'Ormoc City',           5500,  'cash',          '2026-01-22', 1, 'ORMOC',       $ormoc),
            $ar ('AR-2026-002',  'Maria Garcia',                null,              'Quezon City',         48000,  'credit_card',   '2026-01-25', 1, 'QC_MAIN',     $qcMain),
            $soa('SOA-2026-003', 'Eastern Logistics Corp.',    '287-345-678-000', 'Laguna',              65000,  'bank_transfer', '2026-01-28', '2026-02-28', 1, 'QC_MAIN',     $qcMain,     'Logistics'),
            $si ('SI-O-003',     'Hilario Tan',                 null,              'Ormoc City',         120000,  'bank_transfer', '2026-01-30', 1, 'ORMOC',       $ormoc),

            // ── FEBRUARY ─────────────────────────────────────────────────────
            $soa('SOA-2026-004', 'Philippine Tech Inc.',       '287-987-654-000', 'BGC, Taguig',        180000,  'bank_transfer', '2026-02-01', '2026-03-01', 2, 'QC_MAIN',     $qcMain,     'Technology'),
            $si ('SI-2026-003',  'Angelo Bautista',             null,              'Marikina',            15000,  'cash',          '2026-02-05', 2, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $si ('SI-2026-004',  'Carmen Villanueva',           null,              'Pasig City',          13000,  'bpi',           '2026-02-10', 2, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-003',  'Ana Santos',                  null,              'Manila',              35000,  'cash',          '2026-02-12', 2, 'QC_MAIN',     $qcMain),
            $si ('SI-O-004',     'Pedro Villanueva',            null,              'Ormoc City',          42000,  'cash',          '2026-02-15', 2, 'ORMOC',       $ormoc),
            $soa('SOA-2026-005', 'Metro Bank (Employee)',      '287-456-789-000', 'Makati City',        150000,  'bank_transfer', '2026-02-18', '2026-03-18', 2, 'QC_MAIN',     $qcMain,     'Banking'),
            $ar ('AR-2026-004',  'David Reyes',                 null,              'Paranaque',           18000,  'cash',          '2026-02-20', 2, 'QC_MAIN',     $qcMain),
            $si ('SI-O-005',     'Lourdes Gonzalez',            null,              'Ormoc City',          28000,  'bank_transfer', '2026-02-22', 2, 'ORMOC',       $ormoc),
            $soa('SOA-V-001',    'Carmen Villanueva',           null,              'Pasig City',          13000,  'bpi',           '2026-02-10', '2026-03-10', 2, 'VISA_CENTRE', $visaCentre),
            $ar ('AR-2026-005',  'Sarah Lopez',                 null,              'Quezon City',         12000,  'credit_card',   '2026-02-25', 2, 'QC_MAIN',     $qcMain),

            // ── MARCH ────────────────────────────────────────────────────────
            $soa('SOA-2026-006', 'Global BPO Services',        '287-444-555-000', 'Ortigas, Pasig',     225000,  'bank_transfer', '2026-03-01', '2026-04-01', 3, 'QC_MAIN',     $qcMain,     'BPO'),
            $ar ('AR-2026-006',  'Juan Dela Cruz',              null,              'Manila',              25000,  'cash',          '2026-03-01', 3, 'QC_MAIN',     $qcMain),
            $si ('SI-2026-005',  'Liza Ramos',                  null,              'Quezon City',         14000,  'cash',          '2026-03-05', 3, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $si ('SI-O-006',     'Hilario Tan',                 null,              'Ormoc City',         120000,  'bank_transfer', '2026-03-05', 3, 'ORMOC',       $ormoc),
            $soa('SOA-2026-007', 'Ormoc City Government',      '287-666-777-000', 'Ormoc City',          52000,  'bank_transfer', '2026-03-10', '2026-03-25', 3, 'ORMOC',       $ormoc,      'Government', true),
            $si ('SI-2026-006',  'Francis Mendoza',             null,              'Mandaluyong',         12000,  'cash',          '2026-03-15', 3, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-007',  'Corporate Account A',        '287-888-999-000', 'Makati City',         95000,  'bank_transfer', '2026-03-18', 3, 'QC_MAIN',     $qcMain,     'Retail'),
            $soa('SOA-2026-008', 'Sunrise Corp.',              '287-321-654-000', 'Mandaluyong',         78000,  'bank_transfer', '2026-03-20', '2026-04-20', 3, 'QC_MAIN',     $qcMain,     'Manufacturing'),
            $si ('SI-O-007',     'Ricardo Mendoza',             null,              'Ormoc City',          65000,  'credit_card',   '2026-03-22', 3, 'ORMOC',       $ormoc),
            $ar ('AR-2026-008',  'Mercy Fernandez',             null,              'Ormoc City',          22000,  'cash',          '2026-03-25', 3, 'ORMOC',       $ormoc),
            $si ('SI-2026-007',  'Grace Tan',                   null,              'Quezon City',         10000,  'check',         '2026-03-28', 3, 'VISA_CENTRE', $visaCentre, null, 'visa'),

            // ── APRIL ────────────────────────────────────────────────────────
            $soa('SOA-2026-009', 'Asian Finance Group',        '287-112-223-000', 'Ortigas, Pasig',     320000,  'bank_transfer', '2026-04-02', '2026-05-02', 4, 'QC_MAIN',     $qcMain,     'Finance'),
            $si ('SI-2026-008',  'Daniel Lim',                  null,              'Muntinlupa',          16000,  'cash',          '2026-04-05', 4, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-009',  'Maria Garcia (April)',        null,              'Quezon City',         48000,  'credit_card',   '2026-04-08', 4, 'QC_MAIN',     $qcMain),
            $si ('SI-O-008',     'Marissa Aquino',              null,              'Ormoc City',         150000,  'bank_transfer', '2026-04-10', 4, 'ORMOC',       $ormoc),
            $soa('SOA-2026-010', 'Mega Corp Phils.',           '287-998-776-000', 'BGC, Taguig',        240000,  'bank_transfer', '2026-04-12', '2026-05-12', 4, 'QC_MAIN',     $qcMain,     'Conglomerate'),
            $si ('SI-2026-009',  'Michelle Santos',             null,              'Quezon City',         12000,  'cash',          '2026-04-15', 4, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-010',  'Roberto Santos',              null,              'Makati',              38000,  'bank_transfer', '2026-04-18', 4, 'QC_MAIN',     $qcMain),
            $soa('SOA-O-001',    'Ormoc Coop Ltd.',            '287-543-210-000', 'Ormoc City',          88000,  'bank_transfer', '2026-04-20', '2026-05-20', 4, 'ORMOC',       $ormoc,      'Cooperative'),
            $si ('SI-2026-010',  'Carlos Rivera',               null,              'Caloocan',            11000,  'cash',          '2026-04-22', 4, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-011',  'Juana Reyes',                 null,              'Pasay City',          15000,  'cash',          '2026-04-25', 4, 'QC_MAIN',     $qcMain),

            // ── MAY ──────────────────────────────────────────────────────────
            $soa('SOA-2026-011', 'Sunrise Tech Solutions',    '287-765-432-000', 'Makati City',         195000,  'bank_transfer', '2026-05-02', '2026-06-02', 5, 'QC_MAIN',     $qcMain,     'Technology'),
            $si ('SI-2026-011',  'Patricia Dela Rosa',          null,              'Marikina',            13500,  'cash',          '2026-05-05', 5, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-012',  'David Cruz',                  null,              'Quezon City',         55000,  'bank_transfer', '2026-05-07', 5, 'QC_MAIN',     $qcMain),
            $si ('SI-O-009',     'Nena Macalintal',             null,              'Ormoc City',          35000,  'cash',          '2026-05-09', 5, 'ORMOC',       $ormoc),
            $soa('SOA-2026-012', 'Northern Ventures Inc.',    '287-876-543-000', 'Quezon City',         165000,  'bank_transfer', '2026-05-12', '2026-06-12', 5, 'QC_MAIN',     $qcMain,     'Real Estate'),
            $si ('SI-2026-012',  'Emmanuel Garcia',             null,              'Pasig City',          18000,  'cash',          '2026-05-15', 5, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-013',  'Ana Villanueva',              null,              'Manila',              42000,  'credit_card',   '2026-05-18', 5, 'QC_MAIN',     $qcMain),
            $soa('SOA-O-002',    'Leyte Pacific Corp.',        '287-654-321-000', 'Ormoc City',          74000,  'bank_transfer', '2026-05-20', '2026-06-20', 5, 'ORMOC',       $ormoc,      'Trading'),
            $si ('SI-2026-013',  'Rosario Bautista',            null,              'Paranaque',           10500,  'bdo',           '2026-05-22', 5, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-014',  'Jorge Mendoza',               null,              'Caloocan',            22000,  'cash',          '2026-05-25', 5, 'QC_MAIN',     $qcMain),

            // ── JUNE ─────────────────────────────────────────────────────────
            $soa('SOA-2026-013', 'Pacific Rim Corp.',          '287-543-876-000', 'Makati City',         275000,  'bank_transfer', '2026-06-02', '2026-07-02', 6, 'QC_MAIN',     $qcMain,     'Conglomerate'),
            $si ('SI-2026-014',  'Alicia Torres',               null,              'Quezon City',         14500,  'cash',          '2026-06-03', 6, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-015',  'Benito Reyes',                null,              'Manila',              68000,  'bank_transfer', '2026-06-04', 6, 'QC_MAIN',     $qcMain),
            $si ('SI-O-010',     'Felisa Delos Santos',         null,              'Ormoc City',          45000,  'cash',          '2026-06-04', 6, 'ORMOC',       $ormoc),
            $soa('SOA-2026-014', 'Southern Cross Travel',      '287-432-109-000', 'Muntinlupa',          135000,  'bank_transfer', '2026-06-05', '2026-07-05', 6, 'QC_MAIN',     $qcMain,     'Travel Agency'),
            $si ('SI-2026-015',  'Ramon dela Cruz',             null,              'Mandaluyong',         16000,  'cash',          '2026-06-06', 6, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-016',  'Carmela Santos',              null,              'Makati',              52000,  'credit_card',   '2026-06-07', 6, 'QC_MAIN',     $qcMain),
            $soa('SOA-O-003',    'Ormoc City Government',      '287-666-777-000', 'Ormoc City',          93000,  'bank_transfer', '2026-06-08', '2026-06-30', 6, 'ORMOC',       $ormoc,      'Government', true),
            $si ('SI-2026-016',  'Natividad Cruz',              null,              'Pasay',               12500,  'bpi',           '2026-06-09', 6, 'VISA_CENTRE', $visaCentre, null, 'visa'),
            $ar ('AR-2026-017',  'Teodoro Villanueva',          null,              'Quezon City',         38000,  'cash',          '2026-06-10', 6, 'QC_MAIN',     $qcMain),
        ];

        DB::table('bir_transactions')->delete();
        foreach ($transactions as $t) {
            DB::table('bir_transactions')->insert($t);
        }
    }
}
