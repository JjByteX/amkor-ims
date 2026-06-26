<?php

namespace Modules\AccountsPayable\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountsPayableDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now    = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');

        $accounting = DB::table('users')->where('email', 'accounting1@amkor.ph')->value('id');
        $coo        = DB::table('users')->where('email', 'marianne@amkor.ph')->value('id');

        DB::table('payables')->delete();

        $base = [
            'contact_id'               => null,
            'currency'                 => 'PHP',
            'invoice_amount_php'       => 0.00,
            'invoice_amount_usd'       => 0.00,
            'invoice_amount_jpy'       => 0.00,
            'payment_php'              => 0.00,
            'payment_usd'              => 0.00,
            'payment_jpy'              => 0.00,
            'balance_php'              => 0.00,
            'balance_usd'              => 0.00,
            'balance_jpy'              => 0.00,
            'payment_date'             => null,
            'date_received'            => null,
            'mode_of_payment'          => 'bank_deposit',
            'account_no'               => null,
            'acr'                      => null,
            'check_no'                 => null,
            'deposit_slip_attached'    => false,
            'deposit_slip_attached_at' => null,
            'voucher_id'               => null,
            'remarks'                  => null,
            'audit_remarks'            => null,
            'checked_by'               => null,
            'checked_at'               => null,
            'approved_by'              => null,
            'approved_at'              => null,
            'released_by'              => null,
            'released_at'              => null,
            'branch_id'                => $qcMain,
            'created_by'               => $accounting,
            'updated_by'               => $accounting,
            'created_at'               => $now,
            'updated_at'               => $now,
        ];

        $payables = [

            // ══════════════════════════════════════════════════════════════════
            // FULLY PAID — RELEASED
            // ══════════════════════════════════════════════════════════════════

            // 1. PAL — Bangkok corporate airfare
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-001',
                'invoice_date'         => '2026-01-12',
                'invoice_no'           => 'PAL-INV-20260112-001',
                'supplier_name'        => 'Philippine Airlines',
                'invoice_amount_php'   => 112800.00,
                'payment_php'          => 112800.00,
                'due_date'             => '2026-01-28',
                'payment_date'         => '2026-01-25',
                'date_received'        => '2026-01-26',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-01-14 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-01-15 14:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-01-25 11:00:00',
                'account_no'           => 'BDO-0012345678',
                'acr'                  => 'ACR-2026-001',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-01-25 11:30:00',
                'remarks'              => 'Full payment for 6 pax BKK roundtrip (RES-2026-001)',
            ]),

            // 2. Japan Embassy — visa fees batch
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-002',
                'invoice_date'         => '2026-01-08',
                'invoice_no'           => 'JAPEMB-2026-0108',
                'supplier_name'        => 'Japan Embassy Manila',
                'invoice_amount_php'   => 9600.00,
                'payment_php'          => 9600.00,
                'due_date'             => '2026-01-10',
                'payment_date'         => '2026-01-10',
                'date_received'        => '2026-01-10',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-01-09 09:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-01-09 14:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-01-10 09:30:00',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'PHP 3,200 x 3 applicants (Mendoza, Fernandez, batch)',
            ]),

            // 3. Japan Airlines — BDO Tokyo executive trip
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-004',
                'invoice_date'         => '2026-03-05',
                'invoice_no'           => 'JL-INV-20260305-004',
                'supplier_name'        => 'Japan Airlines',
                'invoice_amount_php'   => 196000.00,
                'payment_php'          => 196000.00,
                'due_date'             => '2026-03-22',
                'payment_date'         => '2026-03-20',
                'date_received'        => '2026-03-21',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-03-07 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-03-08 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-03-20 11:00:00',
                'account_no'           => 'BDO-0012345678',
                'acr'                  => 'ACR-2026-005',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-03-20 11:30:00',
                'remarks'              => '4 pax NRT roundtrip fully settled (RES-2026-005)',
            ]),

            // 4. US Embassy — MRV fee (USD cash)
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-005',
                'invoice_date'         => '2026-04-03',
                'invoice_no'           => 'USEMB-MRV-20260403',
                'supplier_name'        => 'US Embassy Manila (MRV Fee)',
                'currency'             => 'USD',
                'invoice_amount_usd'   => 245.00,
                'payment_usd'          => 245.00,
                'due_date'             => '2026-04-08',
                'payment_date'         => '2026-04-07',
                'date_received'        => '2026-04-07',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-04-04 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-04-05 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-04-07 09:30:00',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'USD 245 MRV fee for Aquino B1/B2 application (SI-V-2026-008)',
            ]),

            // 5. VFS Global — UK visa service fee
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-008',
                'invoice_date'         => '2026-01-14',
                'invoice_no'           => 'VFS-2026-0114-UK',
                'supplier_name'        => 'VFS Global Philippines',
                'invoice_amount_php'   => 8500.00,
                'payment_php'          => 8500.00,
                'due_date'             => '2026-01-20',
                'payment_date'         => '2026-01-16',
                'date_received'        => '2026-01-17',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-01-15 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-01-15 15:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-01-16 09:00:00',
                'account_no'           => 'BDO-0012345678',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-01-16 09:30:00',
                'remarks'              => 'VFS service fee for UK visa — Santos (SI-V-2026-002)',
            ]),

            // 6. Alaya Resort Ubud — USD hotel deposit
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-009',
                'invoice_date'         => '2026-05-16',
                'invoice_no'           => 'ALAYA-UBD-20260516',
                'supplier_name'        => 'Alaya Resort Ubud',
                'currency'             => 'USD',
                'invoice_amount_usd'   => 4200.00,
                'payment_usd'          => 4200.00,
                'due_date'             => '2026-05-30',
                'payment_date'         => '2026-05-28',
                'date_received'        => '2026-05-29',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-05-17 09:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-05-18 10:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-05-28 11:00:00',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'USD 4,200 resort deposit for Ayala group bloc (RES-2026-009)',
            ]),

            // 7. Korea KVAC — visa fees
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-010',
                'invoice_date'         => '2026-02-19',
                'invoice_no'           => 'KVAC-2026-0219',
                'supplier_name'        => 'Korea Visa Application Center (KVAC)',
                'invoice_amount_php'   => 3800.00,
                'payment_php'          => 3800.00,
                'due_date'             => '2026-02-21',
                'payment_date'         => '2026-02-20',
                'date_received'        => '2026-02-20',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-02-19 14:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-02-19 16:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-02-20 09:00:00',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'Korea tourist visa filing fee — Lim (SI-V-2026-005)',
            ]),

            // 8. ANA — SM Seoul group tickets
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-011',
                'invoice_date'         => '2026-03-18',
                'invoice_no'           => 'NH-INV-20260318-011',
                'supplier_name'        => 'All Nippon Airways (ANA)',
                'invoice_amount_php'   => 238000.00,
                'payment_php'          => 238000.00,
                'due_date'             => '2026-04-05',
                'payment_date'         => '2026-04-02',
                'date_received'        => '2026-04-03',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-03-20 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-03-21 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-04-02 11:00:00',
                'account_no'           => 'BPI-0098765432',
                'acr'                  => 'ACR-2026-011',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-04-02 11:30:00',
                'remarks'              => '10 pax ICN roundtrip for SM team building (RES-2026-006)',
            ]),

            // 9. Lotte Hotel Seoul — accommodation
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-012',
                'invoice_date'         => '2026-03-22',
                'invoice_no'           => 'LOTTE-SEL-20260322',
                'supplier_name'        => 'Lotte Hotel Seoul',
                'currency'             => 'USD',
                'invoice_amount_usd'   => 3500.00,
                'payment_usd'          => 3500.00,
                'due_date'             => '2026-04-10',
                'payment_date'         => '2026-04-08',
                'date_received'        => '2026-04-09',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-03-24 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-03-25 09:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-04-08 10:00:00',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'Hotel deposit for SM group (RES-2026-006) — 5 rooms x 4 nights',
            ]),

            // 10. Australia Embassy — ETA & service fee
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-013',
                'invoice_date'         => '2026-02-16',
                'invoice_no'           => 'AUSEMB-2026-0216',
                'supplier_name'        => 'Australia Embassy Manila',
                'invoice_amount_php'   => 14200.00,
                'payment_php'          => 14200.00,
                'due_date'             => '2026-02-20',
                'payment_date'         => '2026-02-19',
                'date_received'        => '2026-02-19',
                'status'               => 'paid',
                'approval_status'      => 'released',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-02-17 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-02-17 15:00:00',
                'released_by'          => $accounting,
                'released_at'          => '2026-02-19 09:00:00',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'ETA processing + service fee for Reyes (SI-V-2026-003)',
            ]),

            // ══════════════════════════════════════════════════════════════════
            // PARTIAL / OVERDUE
            // ══════════════════════════════════════════════════════════════════

            // 11. Singapore Airlines — PHT Inc. group (partial, overdue)
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-003',
                'invoice_date'         => '2026-02-08',
                'invoice_no'           => 'SQ-INV-20260208-003',
                'supplier_name'        => 'Singapore Airlines',
                'invoice_amount_php'   => 148500.00,
                'payment_php'          => 74250.00,
                'balance_php'          => 74250.00,
                'due_date'             => '2026-02-28',
                'payment_date'         => '2026-02-20',
                'status'               => 'overdue',
                'approval_status'      => 'approved',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-02-10 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-02-11 14:00:00',
                'account_no'           => 'BPI-0098765432',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-02-20 15:00:00',
                'remarks'              => '50% deposit paid; balance of PHP 74,250 past due (RES-2026-003)',
                'audit_remarks'        => 'Follow-up sent to SQ Manila office on Mar 10.',
            ]),

            // 12. AirAsia — JFC KL Summit (partial, overdue)
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-006',
                'invoice_date'         => '2026-04-10',
                'invoice_no'           => 'AK-INV-20260410-006',
                'supplier_name'        => 'AirAsia',
                'invoice_amount_php'   => 228000.00,
                'payment_php'          => 136800.00,
                'balance_php'          => 91200.00,
                'due_date'             => '2026-04-25',
                'payment_date'         => '2026-04-22',
                'status'               => 'overdue',
                'approval_status'      => 'approved',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-04-12 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-04-13 14:00:00',
                'account_no'           => 'BDO-0012345678',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-04-22 16:00:00',
                'remarks'              => '60% deposit paid; PHP 91,200 balance overdue (RES-2026-007)',
                'audit_remarks'        => 'AK reminding for balance — follow-up Apr 30.',
            ]),

            // 13. Globe Telecom — Cebu offsite supplier invoice
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-014',
                'invoice_date'         => '2026-05-02',
                'invoice_no'           => 'CEBUHOTEL-INV-20260502',
                'supplier_name'        => 'Cebu Parklane International Hotel',
                'invoice_amount_php'   => 96000.00,
                'payment_php'          => 48000.00,
                'balance_php'          => 48000.00,
                'due_date'             => '2026-05-20',
                'payment_date'         => '2026-05-15',
                'status'               => 'overdue',
                'approval_status'      => 'approved',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-05-04 10:00:00',
                'approved_by'          => $coo,
                'approved_at'          => '2026-05-05 09:00:00',
                'account_no'           => 'BDO-0012345678',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-05-15 14:00:00',
                'remarks'              => '50% hotel deposit for Globe Cebu offsite (RES-2026-008); balance due on checkout',
                'audit_remarks'        => 'Hotel requesting balance; need fund release.',
            ]),

            // ══════════════════════════════════════════════════════════════════
            // IN PROGRESS — CHECKED / PENDING
            // ══════════════════════════════════════════════════════════════════

            // 14. Garuda Indonesia — Ayala Bali (checked, awaiting approval)
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-007',
                'invoice_date'         => '2026-05-15',
                'invoice_no'           => 'GA-INV-20260515-007',
                'supplier_name'        => 'Garuda Indonesia',
                'invoice_amount_php'   => 375000.00,
                'payment_php'          => 150000.00,
                'balance_php'          => 225000.00,
                'due_date'             => '2026-06-01',
                'payment_date'         => '2026-05-20',
                'status'               => 'pending',
                'approval_status'      => 'checked',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-05-16 10:00:00',
                'account_no'           => 'BPI-0098765432',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-05-20 14:00:00',
                'remarks'              => '40% deposit paid; PHP 225,000 balance due Jun 1 (RES-2026-009)',
            ]),

            // 15. Canada High Commission — batch visa
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-015',
                'invoice_date'         => '2026-05-10',
                'invoice_no'           => 'CAHC-2026-0510',
                'supplier_name'        => 'Canada High Commission Manila',
                'invoice_amount_php'   => 16800.00,
                'balance_php'          => 16800.00,
                'due_date'             => '2026-05-17',
                'status'               => 'pending',
                'approval_status'      => 'checked',
                'checked_by'           => $accounting,
                'checked_at'           => '2026-05-11 09:00:00',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'Visa fee for Lim (SI-V-2026-010) — PHP 16,800 cash',
            ]),

            // 16. Vietnam Airlines — upcoming Robinsons trip
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-016',
                'invoice_date'         => '2026-06-03',
                'invoice_no'           => 'VN-INV-20260603-016',
                'supplier_name'        => 'Vietnam Airlines',
                'invoice_amount_php'   => 132000.00,
                'balance_php'          => 132000.00,
                'due_date'             => '2026-06-25',
                'status'               => 'pending',
                'approval_status'      => 'pending',
                'remarks'              => '6 pax HAN roundtrip for Robinsons sales conference (RES-2026-010)',
            ]),

            // 17. Schengen — Italy visa filing fee
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-017',
                'invoice_date'         => '2026-06-04',
                'invoice_no'           => 'VFS-SCH-2026-0604',
                'supplier_name'        => 'VFS Global — Schengen',
                'invoice_amount_php'   => 13500.00,
                'balance_php'          => 13500.00,
                'due_date'             => '2026-06-18',
                'status'               => 'pending',
                'approval_status'      => 'pending',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'Italy Schengen filing fee for Tan (SI-V-2026-012)',
            ]),

            // 18. Osaka hotel — Metrobank exec trip deposit (USD)
            array_merge($base, [
                'requisition_no'       => 'REQ-2026-018',
                'invoice_date'         => '2026-06-01',
                'invoice_no'           => 'OSK-HOTEL-20260601',
                'supplier_name'        => 'InterContinental Osaka',
                'currency'             => 'USD',
                'invoice_amount_usd'   => 1800.00,
                'balance_usd'          => 1800.00,
                'due_date'             => '2026-06-20',
                'status'               => 'pending',
                'approval_status'      => 'pending',
                'mode_of_payment'      => 'cash',
                'remarks'              => 'USD 1,800 hotel deposit for Metrobank exec trip (RES-2026-011) — 2 rooms x 3 nights',
            ]),
        ];

        DB::table('payables')->insert($payables);
    }
}
