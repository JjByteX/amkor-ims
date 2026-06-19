<?php

namespace Modules\IataPayments\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IataPaymentsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now    = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');

        $dalle      = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo        = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');

        $contactBdo = DB::table('contacts')->where('name', 'BDO Unibank')->where('currency', 'PHP')->value('id');

        DB::table('iata_payments')->delete();

        $base = [
            'contact_id'               => $contactBdo,
            'voucher_id'               => null,
            'payment_date'             => null,
            'deposit_slip_attached'    => false,
            'deposit_slip_attached_at' => null,
            'operator_notified'        => false,
            'operator_notified_at'     => null,
            'remarks'                  => null,
            'audit_remarks'            => null,
            'checked_by'               => null,
            'checked_at'               => null,
            'approved_by'              => null,
            'approved_at'              => null,
            'released_by'              => null,
            'released_at'              => null,
            'branch_id'                => $qcMain,
            'created_by'               => $dalle,
            'updated_by'               => $dalle,
            'created_at'               => $now,
            'updated_at'               => $now,
        ];

        $payments = [

            // ══════════════════════════════════════════════════════════════════
            // FULLY RELEASED + OPERATOR NOTIFIED
            // ══════════════════════════════════════════════════════════════════

            array_merge($base, [
                'payment_no'               => 'IATA-2026-001',
                'operator_name'            => 'Cebu Pacific Air',
                'billing_reference'        => 'CEB-BSP-2026-JAN-01',
                'billing_date'             => '2026-01-05',
                'due_date'                 => '2026-01-20',
                'amount'                   => 125000.00,
                'payment_date'             => '2026-01-18',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-01-10 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-01-12 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-01-18 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-01-18 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-01-18 14:00:00',
                'remarks'                  => 'BSP weekly remittance cycle — Jan Week 1. Tickets issued Jan 2–5.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-002',
                'operator_name'            => 'Philippine Airlines',
                'billing_reference'        => 'PAL-BSP-2026-JAN-01',
                'billing_date'             => '2026-01-12',
                'due_date'                 => '2026-01-28',
                'amount'                   => 98000.00,
                'payment_date'             => '2026-01-24',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-01-16 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-01-18 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-01-24 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-01-24 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-01-24 14:00:00',
                'remarks'                  => 'BSP remittance — domestic + international PAL tickets week Jan 6–12.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-003',
                'operator_name'            => 'Cebu Pacific Air',
                'billing_reference'        => 'CEB-BSP-2026-JAN-02',
                'billing_date'             => '2026-01-19',
                'due_date'                 => '2026-02-04',
                'amount'                   => 143500.00,
                'payment_date'             => '2026-02-02',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-01-24 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-01-26 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-02-02 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-02-02 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-02-02 14:00:00',
                'remarks'                  => 'BSP cycle Jan 13–19. Higher volume — Bali and Bangkok group bookings.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-004',
                'operator_name'            => 'AirAsia Philippines',
                'billing_reference'        => 'Z2-BSP-2026-JAN-01',
                'billing_date'             => '2026-01-26',
                'due_date'                 => '2026-02-11',
                'amount'                   => 67000.00,
                'payment_date'             => '2026-02-08',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-01-30 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-02-02 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-02-08 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-02-08 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-02-08 14:00:00',
                'remarks'                  => 'AirAsia domestic — Cebu, Davao, Iloilo routes.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-005',
                'operator_name'            => 'Philippine Airlines',
                'billing_reference'        => 'PAL-BSP-2026-FEB-01',
                'billing_date'             => '2026-02-09',
                'due_date'                 => '2026-02-25',
                'amount'                   => 115000.00,
                'payment_date'             => '2026-02-22',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-02-14 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-02-16 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-02-22 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-02-22 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-02-22 14:00:00',
                'remarks'                  => 'PAL Feb cycle 1 — includes executive class upgrades for BDO trip.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-006',
                'operator_name'            => 'Cebu Pacific Air',
                'billing_reference'        => 'CEB-BSP-2026-FEB-01',
                'billing_date'             => '2026-02-16',
                'due_date'                 => '2026-03-04',
                'amount'                   => 88500.00,
                'payment_date'             => '2026-03-01',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-02-20 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-02-23 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-03-01 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-03-01 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-03-01 14:00:00',
                'remarks'                  => 'CEB Feb cycle 1 — domestic and Clark international routes.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-007',
                'operator_name'            => 'Japan Airlines',
                'billing_reference'        => 'JL-BSP-2026-MAR-01',
                'billing_date'             => '2026-03-02',
                'due_date'                 => '2026-03-18',
                'amount'                   => 196000.00,
                'payment_date'             => '2026-03-16',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-03-06 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-03-09 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-03-16 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-03-16 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-03-16 14:00:00',
                'remarks'                  => 'JL NRT cycle — includes BDO Tokyo exec tickets.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-008',
                'operator_name'            => 'Philippine Airlines',
                'billing_reference'        => 'PAL-BSP-2026-MAR-01',
                'billing_date'             => '2026-03-09',
                'due_date'                 => '2026-03-25',
                'amount'                   => 108500.00,
                'payment_date'             => '2026-03-22',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-03-13 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-03-16 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-03-22 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-03-22 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-03-22 14:00:00',
                'remarks'                  => 'PAL Mar cycle 1 — domestic + HKG routes.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-009',
                'operator_name'            => 'All Nippon Airways (ANA)',
                'billing_reference'        => 'NH-BSP-2026-APR-01',
                'billing_date'             => '2026-04-07',
                'due_date'                 => '2026-04-23',
                'amount'                   => 238000.00,
                'payment_date'             => '2026-04-20',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-04-10 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-04-13 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-04-20 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-04-20 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-04-20 14:00:00',
                'remarks'                  => 'ANA ICN group tickets — SM Prime x10 pax.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-010',
                'operator_name'            => 'Cebu Pacific Air',
                'billing_reference'        => 'CEB-BSP-2026-APR-01',
                'billing_date'             => '2026-04-14',
                'due_date'                 => '2026-04-30',
                'amount'                   => 95000.00,
                'payment_date'             => '2026-04-28',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-04-18 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-04-21 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-04-28 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-04-28 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-04-28 14:00:00',
                'remarks'                  => 'CEB Apr cycle 1 — domestic routes and Bali DPS.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-011',
                'operator_name'            => 'Garuda Indonesia',
                'billing_reference'        => 'GA-BSP-2026-MAY-01',
                'billing_date'             => '2026-05-05',
                'due_date'                 => '2026-05-21',
                'amount'                   => 375000.00,
                'payment_date'             => '2026-05-19',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-05-09 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-05-12 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-05-19 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-05-19 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-05-19 14:00:00',
                'remarks'                  => 'GA DPS group — Ayala Land x15 pax (RES-2026-009).',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-012',
                'operator_name'            => 'Philippine Airlines',
                'billing_reference'        => 'PAL-BSP-2026-MAY-01',
                'billing_date'             => '2026-05-12',
                'due_date'                 => '2026-05-28',
                'amount'                   => 128500.00,
                'payment_date'             => '2026-05-25',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-05-16 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-05-19 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-05-25 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-05-25 11:30:00',
                'operator_notified'        => true,
                'operator_notified_at'     => '2026-05-25 14:00:00',
                'remarks'                  => 'PAL May cycle 1 — Globe Cebu offsite tickets.',
            ]),

            // ══════════════════════════════════════════════════════════════════
            // RELEASED — OPERATOR NOT YET NOTIFIED
            // ══════════════════════════════════════════════════════════════════

            array_merge($base, [
                'payment_no'               => 'IATA-2026-013',
                'operator_name'            => 'Cebu Pacific Air',
                'billing_reference'        => 'CEB-BSP-2026-MAY-02',
                'billing_date'             => '2026-05-26',
                'due_date'                 => '2026-06-11',
                'amount'                   => 112000.00,
                'payment_date'             => '2026-06-09',
                'status'                   => 'paid',
                'approval_status'          => 'released',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-05-30 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-06-02 10:00:00',
                'released_by'              => $coo,
                'released_at'              => '2026-06-09 11:00:00',
                'deposit_slip_attached'    => true,
                'deposit_slip_attached_at' => '2026-06-09 11:30:00',
                'operator_notified'        => false,
                'remarks'                  => 'CEB May cycle 2 — deposit slip filed; pending operator notification.',
                'audit_remarks'            => 'Paid Jun 9; notification email to CEB BSP desk pending.',
            ]),

            // ══════════════════════════════════════════════════════════════════
            // APPROVED — AWAITING RELEASE
            // ══════════════════════════════════════════════════════════════════

            array_merge($base, [
                'payment_no'               => 'IATA-2026-014',
                'operator_name'            => 'AirAsia Philippines',
                'billing_reference'        => 'Z2-BSP-2026-JUN-01',
                'billing_date'             => '2026-06-02',
                'due_date'                 => '2026-06-18',
                'amount'                   => 78500.00,
                'status'                   => 'pending',
                'approval_status'          => 'approved',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-06-06 09:00:00',
                'approved_by'              => $accounting,
                'approved_at'              => '2026-06-09 10:00:00',
                'remarks'                  => 'AirAsia Jun cycle 1 — approved; fund release needed before Jun 18.',
            ]),

            // ══════════════════════════════════════════════════════════════════
            // CHECKED — AWAITING APPROVAL
            // ══════════════════════════════════════════════════════════════════

            array_merge($base, [
                'payment_no'               => 'IATA-2026-015',
                'operator_name'            => 'Japan Airlines',
                'billing_reference'        => 'JL-BSP-2026-JUN-01',
                'billing_date'             => '2026-06-09',
                'due_date'                 => '2026-06-25',
                'amount'                   => 210000.00,
                'status'                   => 'pending',
                'approval_status'          => 'checked',
                'checked_by'               => $dalle,
                'checked_at'               => '2026-06-12 09:00:00',
                'remarks'                  => 'JL Jun cycle — includes Osaka exec trip (RES-2026-011). Awaiting JRT approval.',
                'audit_remarks'            => 'Billing reference confirmed with JL Manila station. Amount matches booking confirmations.',
            ]),

            // ══════════════════════════════════════════════════════════════════
            // OVERDUE — PENDING PROCESSING
            // ══════════════════════════════════════════════════════════════════

            array_merge($base, [
                'payment_no'               => 'IATA-2026-016',
                'operator_name'            => 'Jetstar Asia',
                'billing_reference'        => '3K-BSP-2026-MAY-01',
                'billing_date'             => '2026-05-19',
                'due_date'                 => '2026-06-04',
                'amount'                   => 45000.00,
                'status'                   => 'overdue',
                'approval_status'          => 'pending',
                'remarks'                  => 'Jetstar Singapore routes — past due. Still pending initial check.',
                'audit_remarks'            => 'Received late from operations. Immediate processing required.',
            ]),

            // ══════════════════════════════════════════════════════════════════
            // PENDING — CURRENT / UPCOMING
            // ══════════════════════════════════════════════════════════════════

            array_merge($base, [
                'payment_no'               => 'IATA-2026-017',
                'operator_name'            => 'Vietnam Airlines',
                'billing_reference'        => 'VN-BSP-2026-JUN-01',
                'billing_date'             => '2026-06-09',
                'due_date'                 => '2026-06-25',
                'amount'                   => 132000.00,
                'status'                   => 'pending',
                'approval_status'          => 'pending',
                'remarks'                  => 'VN HAN group tickets — Robinsons sales conference (RES-2026-010). For processing.',
            ]),

            array_merge($base, [
                'payment_no'               => 'IATA-2026-018',
                'operator_name'            => 'Cebu Pacific Air',
                'billing_reference'        => 'CEB-BSP-2026-JUN-01',
                'billing_date'             => '2026-06-09',
                'due_date'                 => '2026-06-25',
                'amount'                   => 110000.00,
                'status'                   => 'pending',
                'approval_status'          => 'pending',
                'remarks'                  => 'CEB Jun cycle 1 — domestic routes and misc. For initial check.',
            ]),
        ];

        foreach ($payments as $p) {
            DB::table('iata_payments')->insert($p);
        }
    }
}
