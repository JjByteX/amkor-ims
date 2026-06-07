<?php

namespace Modules\IataPayments\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IataPaymentsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');

        $dalle = DB::table('users')->where('email', 'dalle@amkor.ph')->value('id');
        $accounting = DB::table('users')->where('email', 'accounting@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'coo@amkor.ph')->value('id');

        $contactBdo = DB::table('contacts')->where('name', 'BDO Unibank')->where('currency', 'PHP')->value('id');

        $v5 = DB::table('vouchers')->where('voucher_no', 'CV-2026-005')->value('id');
        $v8 = DB::table('vouchers')->where('voucher_no', 'DV-2026-008')->value('id');

        $payments = [
            [
                'payment_no' => 'IATA-2026-001', 'contact_id' => $contactBdo,
                'operator_name' => 'Cebu Pacific Air', 'billing_reference' => 'CEB-BILL-2026-001',
                'billing_date' => '2026-01-05', 'due_date' => '2026-01-20',
                'amount' => 125000.00, 'payment_date' => '2026-01-18',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-01-10 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-01-12 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-01-18 11:00:00',
                'deposit_slip_attached' => true, 'deposit_slip_attached_at' => '2026-01-18 11:00:00',
                'operator_notified' => true, 'operator_notified_at' => '2026-01-18 14:00:00',
                'voucher_id' => $v5,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'payment_no' => 'IATA-2026-002', 'contact_id' => $contactBdo,
                'operator_name' => 'Philippine Airlines', 'billing_reference' => 'PAL-BILL-2026-002',
                'billing_date' => '2026-02-01', 'due_date' => '2026-02-15',
                'amount' => 98000.00, 'payment_date' => '2026-02-12',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-02-05 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-02-08 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-02-12 11:00:00',
                'deposit_slip_attached' => true, 'deposit_slip_attached_at' => '2026-02-12 11:00:00',
                'operator_notified' => true, 'operator_notified_at' => '2026-02-12 14:00:00',
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'payment_no' => 'IATA-2026-003', 'contact_id' => $contactBdo,
                'operator_name' => 'AirAsia', 'billing_reference' => 'AIR-BILL-2026-003',
                'billing_date' => '2026-03-01', 'due_date' => '2026-03-15',
                'amount' => 67000.00, 'payment_date' => '2026-03-12',
                'status' => 'paid',
                'approval_status' => 'released', 'checked_by' => $dalle, 'checked_at' => '2026-03-05 09:00:00',
                'approved_by' => $accounting, 'approved_at' => '2026-03-08 10:00:00',
                'released_by' => $coo, 'released_at' => '2026-03-12 11:00:00',
                'deposit_slip_attached' => true, 'deposit_slip_attached_at' => '2026-03-12 11:00:00',
                'operator_notified' => true, 'operator_notified_at' => '2026-03-12 14:00:00',
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'payment_no' => 'IATA-2026-004', 'contact_id' => $contactBdo,
                'operator_name' => 'Jetstar Asia', 'billing_reference' => 'JET-BILL-2026-004',
                'billing_date' => '2026-04-01', 'due_date' => '2026-04-15',
                'amount' => 45000.00, 'payment_date' => null,
                'status' => 'overdue',
                'approval_status' => 'checked', 'checked_by' => $dalle, 'checked_at' => '2026-04-05 09:00:00',
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'deposit_slip_attached' => false, 'deposit_slip_attached_at' => null,
                'operator_notified' => false, 'operator_notified_at' => null,
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'payment_no' => 'IATA-2026-005', 'contact_id' => $contactBdo,
                'operator_name' => 'Philippine Airlines', 'billing_reference' => 'PAL-BILL-2026-005',
                'billing_date' => '2026-05-01', 'due_date' => '2026-05-15',
                'amount' => 3200.00, 'payment_date' => null,
                'status' => 'overdue',
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'deposit_slip_attached' => false, 'deposit_slip_attached_at' => null,
                'operator_notified' => false, 'operator_notified_at' => null,
                'voucher_id' => $v8,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'payment_no' => 'IATA-2026-006', 'contact_id' => $contactBdo,
                'operator_name' => 'Cebu Pacific Air', 'billing_reference' => 'CEB-BILL-2026-006',
                'billing_date' => '2026-06-01', 'due_date' => '2026-06-15',
                'amount' => 110000.00, 'payment_date' => null,
                'status' => 'pending',
                'approval_status' => 'pending', 'checked_by' => null, 'checked_at' => null,
                'approved_by' => null, 'approved_at' => null,
                'released_by' => null, 'released_at' => null,
                'deposit_slip_attached' => false, 'deposit_slip_attached_at' => null,
                'operator_notified' => false, 'operator_notified_at' => null,
                'voucher_id' => null,
                'branch_id' => $qcMain, 'created_by' => $dalle, 'updated_by' => $dalle,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($payments as $p) {
            DB::table('iata_payments')->insert($p);
        }
    }
}
