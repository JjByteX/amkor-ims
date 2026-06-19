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
        
        $ormoc      = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $accounting = DB::table('users')->where('email', 'accounting1@amkor.ph')->value('id');

        DB::table('bir_transactions')->delete();

        // ── Helpers ───────────────────────────────────────────────────────────

        /**
         * Sales Invoice (SI) — vatable, standard 12% VAT.
         * BIR ATP number is required for all SI records.
         */
        $si = function (
            string $docNo, string $client, ?string $tin, string $address,
            float $gross, string $mode, string $date, int $month,
            string $branchCode, int $branchId,
            string $sourceType = 'booking', ?string $bStyle = null,
            ?string $particulars = null
        ) use ($accounting, $now): array {
            $vatable = round($gross / 1.12, 2);
            $vat     = round($gross - $vatable, 2);
            return [
                'source_type'               => $sourceType,
                'source_id'                 => null,
                'document_type'             => 'SI',
                'document_number'           => $docNo,
                'client_name'               => $client,
                'tin'                       => $tin,
                'address'                   => $address,
                'business_style'            => $bStyle,
                'gross_amount'              => $gross,
                'vatable_sales'             => $vatable,
                'vat_exempt_sales'          => 0,
                'vat_zero_rated_sales'      => 0,
                'vat_amount'                => $vat,
                'total_sales_vat_inclusive' => $gross,
                'sc_pwd_discount'           => 0,
                'withholding_tax'           => 0,
                'net_amount_due'            => $gross,
                'mode_of_payment'           => $mode,
                'check_number'              => null,
                'transaction_date'          => $date,
                'due_date'                  => null,
                'year'                      => 2026,
                'month'                     => $month,
                'branch_code'               => $branchCode,
                'branch_id'                 => $branchId,
                'bir_atp_number'            => '089AU2025',
                'particulars'               => $particulars,
                'line_items'                => null,
                'pdf_generated'             => false,
                'pdf_generated_at'          => null,
                'pdf_path'                  => null,
                'remarks'                   => null,
                'created_by'                => $accounting,
                'updated_by'                => $accounting,
                'created_at'                => $now,
                'updated_at'                => $now,
            ];
        };

        /**
         * Acknowledgement Receipt (AR) — no VAT breakdown required.
         * 2% withholding tax applies for corporate clients.
         */
        $ar = function (
            string $docNo, string $client, ?string $tin, string $address,
            float $gross, string $mode, string $date, int $month,
            string $branchCode, int $branchId,
            ?string $bStyle = null, ?string $particulars = null
        ) use ($accounting, $now): array {
            $wht = $tin ? round($gross * 0.02, 2) : 0; // withholding only for corporate (with TIN)
            return [
                'source_type'               => 'collectible',
                'source_id'                 => null,
                'document_type'             => 'AR',
                'document_number'           => $docNo,
                'client_name'               => $client,
                'tin'                       => $tin,
                'address'                   => $address,
                'business_style'            => $bStyle,
                'gross_amount'              => $gross,
                'vatable_sales'             => 0,
                'vat_exempt_sales'          => 0,
                'vat_zero_rated_sales'      => 0,
                'vat_amount'                => 0,
                'total_sales_vat_inclusive' => $gross,
                'sc_pwd_discount'           => 0,
                'withholding_tax'           => $wht,
                'net_amount_due'            => round($gross - $wht, 2),
                'mode_of_payment'           => $mode,
                'check_number'              => null,
                'transaction_date'          => $date,
                'due_date'                  => null,
                'year'                      => 2026,
                'month'                     => $month,
                'branch_code'               => $branchCode,
                'branch_id'                 => $branchId,
                'bir_atp_number'            => null,
                'particulars'               => $particulars,
                'line_items'                => null,
                'pdf_generated'             => false,
                'pdf_generated_at'          => null,
                'pdf_path'                  => null,
                'remarks'                   => null,
                'created_by'                => $accounting,
                'updated_by'                => $accounting,
                'created_at'                => $now,
                'updated_at'                => $now,
            ];
        };

        /**
         * Statement of Account (SOA) — multi-line, with optional VAT exemption.
         * Line items stored as JSON for detail rendering and PDF generation.
         */
        $soa = function (
            string $docNo, string $client, ?string $tin, string $address,
            float $gross, string $mode, string $date, string $due,
            int $month, string $branchCode, int $branchId,
            ?string $bStyle = null, bool $vatExempt = false,
            ?array $lineItems = null, ?string $particulars = null
        ) use ($accounting, $now): array {
            $vatable = $vatExempt ? 0 : round($gross / 1.12, 2);
            $vat     = $vatExempt ? 0 : round($gross - $vatable, 2);
            $exempt  = $vatExempt ? $gross : 0;
            return [
                'source_type'               => 'booking',
                'source_id'                 => null,
                'document_type'             => 'SOA',
                'document_number'           => $docNo,
                'client_name'               => $client,
                'tin'                       => $tin,
                'address'                   => $address,
                'business_style'            => $bStyle,
                'gross_amount'              => $gross,
                'vatable_sales'             => $vatable,
                'vat_exempt_sales'          => $exempt,
                'vat_zero_rated_sales'      => 0,
                'vat_amount'                => $vat,
                'total_sales_vat_inclusive' => $gross,
                'sc_pwd_discount'           => 0,
                'withholding_tax'           => 0,
                'net_amount_due'            => $gross,
                'mode_of_payment'           => $mode,
                'check_number'              => null,
                'transaction_date'          => $date,
                'due_date'                  => $due,
                'year'                      => 2026,
                'month'                     => $month,
                'branch_code'               => $branchCode,
                'branch_id'                 => $branchId,
                'bir_atp_number'            => null,
                'particulars'               => $particulars,
                'line_items'                => $lineItems ? json_encode($lineItems) : null,
                'pdf_generated'             => false,
                'pdf_generated_at'          => null,
                'pdf_path'                  => null,
                'remarks'                   => null,
                'created_by'                => $accounting,
                'updated_by'                => $accounting,
                'created_at'                => $now,
                'updated_at'                => $now,
            ];
        };

        // ── Transaction records ───────────────────────────────────────────────

        $transactions = [

            // ══════════════════════════════════════════════════════════════════
            // JANUARY 2026
            // ══════════════════════════════════════════════════════════════════

            $soa('SOA-2026-001', 'Manila Solutions Corp.', '287-123-456-000', '123 Ayala Ave., Makati City', 156000, 'bank_transfer', '2026-01-15', '2026-02-15', 1, 'QC_MAIN', $qcMain, 'IT Solutions', false, [
                ['date' => '2026-01-15', 'description' => 'Bangkok roundtrip airfare — PAL (6 pax, Feb 15–22)', 'amount' => 112800.00],
                ['date' => '2026-01-15', 'description' => 'Hotel accommodation — Amari Bangkok (6 rooms, 7 nights)', 'amount' => 33600.00],
                ['date' => '2026-01-15', 'description' => 'Travel insurance — 6 pax', 'amount' => 9600.00],
            ], 'RES-2026-001 — Bangkok Corporate Trip'),

            $si('SI-2026-001',  'Carlos Mendoza',     null,              '14 Mariposa St., Quezon City',           4800,  'cash',          '2026-01-05', 1, 'QC_MAIN', $qcMain, 'visa', null, 'Japan Tourist Visa — processing fee'),
            $si('SI-2026-002',  'Maria Santos',        null,              '55 Banawe St., Quezon City',            12500,  'bdo',           '2026-01-13', 1, 'QC_MAIN', $qcMain, 'visa', null, 'UK Standard Visitor Visa — processing and VFS service fee'),
            $si('SI-O-2026-001','Rolando Diaz',         null,              '22 Real St., Ormoc City',              16500,  'cash',          '2026-01-10', 1, 'ORMOC',       $ormoc, 'booking', null, 'Cebu Weekend Trip package (SI-ORM-2026-001)'),
            $ar('AR-2026-001',  'Manila Solutions Corp.','287-123-456-000','123 Ayala Ave., Makati City',         156000,  'bank_transfer', '2026-01-22', 1, 'QC_MAIN',     $qcMain, 'IT Solutions', 'Full payment received — RES-2026-001'),

            $soa('SOA-2026-002', 'Ayala Business Center', '902-345-678-000', 'Ayala Triangle, Makati City', 248000, 'bank_transfer', '2026-01-22', '2026-02-22', 1, 'QC_MAIN', $qcMain, 'Real Estate', false, [
                ['date' => '2026-01-22', 'description' => 'HK roundtrip airfare — Cathay Pacific (8 pax, Mar 3–7)', 'amount' => 168000.00],
                ['date' => '2026-01-22', 'description' => 'Hotel — Cordis Hong Kong (8 rooms, 4 nights)', 'amount' => 62400.00],
                ['date' => '2026-01-22', 'description' => 'Tour + transfers — Hong Kong (8 pax)', 'amount' => 12800.00],
                ['date' => '2026-01-22', 'description' => 'Travel insurance — 8 pax', 'amount' => 4800.00],
            ], 'RES-2026-002 — HK Incentive Trip'),

            $si('SI-2026-003', 'Rafael de Guzman', null, '78 Scout Alcaraz, Quezon City', 3200, 'cash', '2026-01-20', 1, 'QC_MAIN', $qcMain, 'visa', null, 'South Korea Tourist Visa — processing fee'),

            // ══════════════════════════════════════════════════════════════════
            // FEBRUARY 2026
            // ══════════════════════════════════════════════════════════════════

            $ar('AR-2026-002', 'Ayala Business Center', '902-345-678-000', 'Ayala Triangle, Makati City', 248000, 'bank_transfer', '2026-02-05', 2, 'QC_MAIN', $qcMain, 'Real Estate', 'Full payment — RES-2026-002 HK trip'),

            $soa('SOA-2026-003', 'Philippine Tech Inc.', '287-987-654-000', '5/F Alveo Tower, BGC Taguig', 198000, 'bank_transfer', '2026-02-10', '2026-03-10', 2, 'QC_MAIN', $qcMain, 'Technology', false, [
                ['date' => '2026-02-10', 'description' => 'Singapore roundtrip airfare — SQ (9 pax, Mar 10–15)', 'amount' => 148500.00],
                ['date' => '2026-02-10', 'description' => 'Hotel — Marina Bay Sands (9 rooms, 5 nights)', 'amount' => 40500.00],
                ['date' => '2026-02-10', 'description' => 'Tours and transfers — Singapore', 'amount' => 7200.00],
                ['date' => '2026-02-10', 'description' => 'Travel insurance — 9 pax', 'amount' => 1800.00],
            ], 'RES-2026-003 — Singapore Company Retreat'),

            $si('SI-2026-004', 'Ana Reyes',  null, '3 Dona Juliana Rd., Paranaque', 18500, 'cash',  '2026-02-18', 2, 'QC_MAIN', $qcMain, 'visa', null, 'Australia Tourist Visa — ETA + VFS processing fee'),
            $si('SI-2026-005', 'Ricardo Yap', null, '10 Kamias Rd., Quezon City', 8500, 'bpi', '2026-02-22', 2, 'QC_MAIN', $qcMain, 'visa', null, 'Japan Multiple-Entry Visa — processing fee'),

            $si('SI-O-2026-002', 'Edgar Salas', null, '8 Leyte St., Ormoc City', 65000, 'bank_transfer', '2026-02-05', 2, 'ORMOC', $ormoc, 'booking', null, 'Singapore trip package (SI-ORM-2026-003)'),

            $soa('SOA-2026-004', 'Pacific Rim Investments', '540-123-789-000', '18/F Pacific Star Bldg., Makati', 45000, 'bank_transfer', '2026-02-25', '2026-03-25', 2, 'QC_MAIN', $qcMain, 'Investment', false, [
                ['date' => '2026-02-25', 'description' => 'Sydney roundtrip — Qantas (3 pax, Apr 28–May 2)', 'amount' => 38400.00],
                ['date' => '2026-02-25', 'description' => 'Travel insurance — 3 pax', 'amount' => 2700.00],
                ['date' => '2026-02-25', 'description' => 'Airport transfers — SYD', 'amount' => 3900.00],
            ], 'RES-2026-004 — Sydney Conference (PHP portion)'),

            // ══════════════════════════════════════════════════════════════════
            // MARCH 2026
            // ══════════════════════════════════════════════════════════════════

            $ar('AR-2026-003', 'Philippine Tech Inc.', '287-987-654-000', '5/F Alveo Tower, BGC Taguig', 99000, 'bank_transfer', '2026-03-05', 3, 'QC_MAIN', $qcMain, 'Technology', '50% deposit received — RES-2026-003 (balance overdue)'),

            $soa('SOA-2026-005', 'BDO Unibank Inc.', '040-531-678-000', 'BDO Corporate Center, Makati', 280000, 'bank_transfer', '2026-03-08', '2026-03-25', 3, 'QC_MAIN', $qcMain, 'Banking', false, [
                ['date' => '2026-03-08', 'description' => 'Tokyo roundtrip airfare — JL (4 pax, Apr 5–12)', 'amount' => 196000.00],
                ['date' => '2026-03-08', 'description' => 'Hotel — Shinjuku Granbell (4 rooms, 7 nights)', 'amount' => 67200.00],
                ['date' => '2026-03-08', 'description' => 'JR Pass (7-day) — 4 pax', 'amount' => 12800.00],
                ['date' => '2026-03-08', 'description' => 'Travel insurance — 4 pax', 'amount' => 4000.00],
            ], 'RES-2026-005 — Tokyo Executive Trip'),

            $si('SI-2026-006', 'Marco Aquino',   null, '22 Maginhawa St., QC',  18000, 'bdo', '2026-03-15', 3, 'QC_MAIN', $qcMain, 'visa', null, 'US B1/B2 Visitor Visa — processing + MRV facilitation'),
            $si('SI-2026-007', 'Luisa Villanueva', null, '5 Scout Tuason, QC',  14500, 'cash', '2026-03-20', 3, 'QC_MAIN', $qcMain, 'visa', null, 'Schengen (Germany) Tourist Visa — processing fee'),

            $soa('SOA-2026-006', 'SM Prime Holdings', '048-000-123-000', 'SM Mall of Asia Arena, Pasay', 340000, 'bank_transfer', '2026-03-20', '2026-04-10', 3, 'QC_MAIN', $qcMain, 'Retail / Real Estate', false, [
                ['date' => '2026-03-20', 'description' => 'Seoul roundtrip airfare — ANA (10 pax, Apr 20–24)', 'amount' => 238000.00],
                ['date' => '2026-03-20', 'description' => 'Hotel — Lotte Hotel Seoul (10 rooms, 4 nights)', 'amount' => 80000.00],
                ['date' => '2026-03-20', 'description' => 'Tour + DMZ package — 10 pax', 'amount' => 15000.00],
                ['date' => '2026-03-20', 'description' => 'Travel insurance — 10 pax', 'amount' => 7000.00],
            ], 'RES-2026-006 — Seoul Team Building'),

            $si('SI-O-2026-003', 'Pacita Villanueva', null, '40 Burgos St., Ormoc City', 52000, 'cash', '2026-03-28', 3, 'ORMOC', $ormoc, 'booking', null, 'Boracay Family Package — SI-ORM-2026-005'),

            // ══════════════════════════════════════════════════════════════════
            // APRIL 2026
            // ══════════════════════════════════════════════════════════════════

            $ar('AR-2026-004', 'BDO Unibank Inc.', '040-531-678-000', 'BDO Corporate Center, Makati', 280000, 'bank_transfer', '2026-04-03', 4, 'QC_MAIN', $qcMain, 'Banking', 'Full payment — RES-2026-005 Tokyo exec trip'),
            $ar('AR-2026-005', 'SM Prime Holdings', '048-000-123-000', 'SM Mall of Asia Arena, Pasay', 340000, 'bank_transfer', '2026-04-12', 4, 'QC_MAIN', $qcMain, 'Retail / Real Estate', 'Full payment — RES-2026-006 Seoul team building'),

            $si('SI-2026-008', 'Beatrice Lim',   null, '7 Katipunan Ave., QC',  22000, 'cash', '2026-04-05', 4, 'QC_MAIN', $qcMain, 'visa', null, 'Canada Visitor Visa — processing fee'),
            $si('SI-2026-009', 'Marco Aquino',   null, '22 Maginhawa St., QC',  18000, 'bdo',  '2026-04-07', 4, 'QC_MAIN', $qcMain, 'visa', null, 'US B1/B2 — balance settlement (MRV fee paid in USD)'),

            $soa('SOA-2026-007', 'Jollibee Foods Corporation', '005-823-234-000', 'Jollibee Plaza, Ortigas', 312000, 'bank_transfer', '2026-04-12', '2026-04-28', 4, 'QC_MAIN', $qcMain, 'Food & Beverage', false, [
                ['date' => '2026-04-12', 'description' => 'KL roundtrip airfare — AirAsia (12 pax, May 8–11)', 'amount' => 228000.00],
                ['date' => '2026-04-12', 'description' => 'Hotel — Mandarin Oriental KL (12 rooms, 3 nights)', 'amount' => 67200.00],
                ['date' => '2026-04-12', 'description' => 'Summit venue transfers — 12 pax', 'amount' => 10800.00],
                ['date' => '2026-04-12', 'description' => 'Travel insurance — 12 pax', 'amount' => 6000.00],
            ], 'RES-2026-007 — KL Leadership Summit'),

            $si('SI-O-2026-004', 'Ormoc City Government', '287-666-777-000', 'City Hall, Ormoc City', 88000, 'bank_transfer', '2026-04-20', 4, 'ORMOC', $ormoc, 'booking', 'Government', 'Official Delegation — SI-ORM-2026-007'),

            // ══════════════════════════════════════════════════════════════════
            // MAY 2026
            // ══════════════════════════════════════════════════════════════════

            $ar('AR-2026-006', 'Jollibee Foods Corporation', '005-823-234-000', 'Jollibee Plaza, Ortigas', 187200, 'bank_transfer', '2026-05-02', 5, 'QC_MAIN', $qcMain, 'Food & Beverage', '60% deposit — RES-2026-007 (balance outstanding)'),

            $soa('SOA-2026-008', 'Ayala Land Inc.', '000-168-845-000', 'Ayala Triangle, Makati City', 525000, 'bank_transfer', '2026-05-18', '2026-06-01', 5, 'QC_MAIN', $qcMain, 'Real Estate', false, [
                ['date' => '2026-05-18', 'description' => 'Bali roundtrip airfare — Garuda Indonesia (15 pax, Jun 12–17)', 'amount' => 375000.00],
                ['date' => '2026-05-18', 'description' => 'Villa accommodation — Alaya Resort Ubud (15 pax, 5 nights)', 'amount' => 119000.00],
                ['date' => '2026-05-18', 'description' => 'Bali tours, transfers, and cultural experiences', 'amount' => 22500.00],
                ['date' => '2026-05-18', 'description' => 'Travel insurance — 15 pax', 'amount' => 8500.00],
            ], 'RES-2026-009 — Bali Incentive Trip'),

            $si('SI-2026-010', 'Gloria Marcos',  null, '3 Narra St., Marikina',   9500, 'cash', '2026-05-08', 5, 'QC_MAIN', $qcMain, 'visa', null, 'Japan Tourist Visa (3-year multiple-entry) — processing fee'),
            $si('SI-2026-011', 'Joseph Tan',     null, '100 Sto. Tomas St., QC', 16500, 'cash', '2026-05-12', 5, 'QC_MAIN', $qcMain, 'visa', null, 'Schengen (Italy) Tourist Visa — processing + VFS filing fee'),

            $soa('SOA-2026-009', 'Globe Telecom Inc.', '005-576-432-000', 'The Globe Tower, BGC Taguig', 175000, 'bank_transfer', '2026-05-05', '2026-05-28', 5, 'QC_MAIN', $qcMain, 'Telecommunications', false, [
                ['date' => '2026-05-05', 'description' => 'Cebu roundtrip airfare — PAL (7 pax, Jun 5–8)', 'amount' => 91000.00],
                ['date' => '2026-05-05', 'description' => 'Hotel — Cebu Parklane International (7 rooms, 3 nights)', 'amount' => 63000.00],
                ['date' => '2026-05-05', 'description' => 'Transfers and team dinner — Cebu', 'amount' => 14700.00],
                ['date' => '2026-05-05', 'description' => 'Travel insurance — 7 pax', 'amount' => 6300.00],
            ], 'RES-2026-008 — Cebu Offsite'),

            $ar('AR-2026-007', 'Globe Telecom Inc.', '005-576-432-000', 'The Globe Tower, BGC Taguig', 87500, 'bank_transfer', '2026-05-10', 5, 'QC_MAIN', $qcMain, 'Telecommunications', '50% deposit — RES-2026-008 Cebu offsite'),
            $ar('AR-2026-008', 'Ayala Land Inc.', '000-168-845-000', 'Ayala Triangle, Makati City', 210000, 'bank_transfer', '2026-05-20', 5, 'QC_MAIN', $qcMain, 'Real Estate', '40% deposit — RES-2026-009 Bali trip'),

            $si('SI-O-2026-005', 'Pacita Villanueva', null, '40 Burgos St., Ormoc City', 26000, 'cash', '2026-05-05', 5, 'ORMOC', $ormoc, 'booking', null, 'Boracay balance payment (SI-ORM-2026-005)'),

            // ══════════════════════════════════════════════════════════════════
            // JUNE 2026
            // ══════════════════════════════════════════════════════════════════

            $soa('SOA-2026-010', 'Robinsons Land Corp.', '003-831-234-000', 'Robinsons Galleria, Ortigas', 192000, 'bank_transfer', '2026-06-02', '2026-06-20', 6, 'QC_MAIN', $qcMain, 'Real Estate', false, [
                ['date' => '2026-06-02', 'description' => 'Hanoi roundtrip airfare — VN (6 pax, Jul 10–14)', 'amount' => 132000.00],
                ['date' => '2026-06-02', 'description' => 'Hotel — Sofitel Legend Metropole Hanoi (6 rooms, 4 nights)', 'amount' => 48000.00],
                ['date' => '2026-06-02', 'description' => 'Tours and transfers — Hanoi + Ha Long Bay', 'amount' => 9000.00],
                ['date' => '2026-06-02', 'description' => 'Travel insurance — 6 pax', 'amount' => 3000.00],
            ], 'RES-2026-010 — Vietnam Sales Conference'),

            $soa('SOA-2026-011', 'Metrobank Cards Corp.', '012-456-789-000', 'Metrobank Plaza, Makati', 145000, 'bank_transfer', '2026-06-05', '2026-06-25', 6, 'QC_MAIN', $qcMain, 'Banking / Finance', false, [
                ['date' => '2026-06-05', 'description' => 'Osaka roundtrip airfare — JL (2 pax, Jul 8–14)', 'amount' => 112000.00],
                ['date' => '2026-06-05', 'description' => 'Hotel — InterContinental Osaka (2 rooms, 6 nights)', 'amount' => 24000.00],
                ['date' => '2026-06-05', 'description' => 'Shinkansen and transfers — Osaka/Kyoto', 'amount' => 6500.00],
                ['date' => '2026-06-05', 'description' => 'Travel insurance — 2 pax', 'amount' => 2500.00],
            ], 'RES-2026-011 — Executive Osaka Trip (PHP portion)'),

            $si('SI-2026-012', 'Beatrice Lim',   null, '7 Katipunan Ave., QC',  22000, 'bdo',  '2026-06-05', 6, 'QC_MAIN', $qcMain, 'visa', null, 'Canada Visitor Visa — balance (biometrics + courier)'),
            $si('SI-2026-013', 'Joseph Tan',     null, '100 Sto. Tomas St., QC', 16500, 'cash', '2026-06-05', 6, 'QC_MAIN', $qcMain, 'visa', null, 'Schengen Italy — balance and filing fee (SI-V-2026-012)'),
            $si('SI-2026-014', 'Carmela Ocampo', null, '12 Teachers Village, QC', 4800, 'cash', '2026-06-10', 6, 'QC_MAIN', $qcMain, 'visa', null, 'Japan Tourist Visa — processing fee'),
            $si('SI-2026-015', 'Dennis Navarro', null, '5 Heroes Hill, Quezon City', 12500, 'bdo', '2026-06-12', 6, 'QC_MAIN', $qcMain, 'visa', null, 'UK Standard Visitor Visa — processing fee'),

            $si('SI-O-2026-006', 'Ormoc City Government', '287-666-777-000', 'City Hall, Ormoc City', 88000, 'bank_transfer', '2026-06-08', 6, 'ORMOC', $ormoc, 'booking', 'Government', 'Official Delegation package — Jun 15–20'),
        ];

        DB::table('bir_transactions')->delete();
        foreach ($transactions as $t) {
            DB::table('bir_transactions')->insert($t);
        }
    }
}
