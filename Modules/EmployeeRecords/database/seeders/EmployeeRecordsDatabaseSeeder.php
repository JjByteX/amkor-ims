<?php

namespace Modules\EmployeeRecords\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeeRecordsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');
        $ormoc = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $employees = [
            [
                'first_name' => 'Jose', 'last_name' => 'Tolentino', 'middle_name' => 'Reyes',
                'suffix' => null, 'date_of_birth' => '1985-03-15', 'gender' => 'Male', 'civil_status' => 'Married',
                'employee_code' => 'EMP-001', 'position' => 'General Manager', 'department' => 'Executive',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2018-06-01', 'regularization_date' => '2018-12-01',
                'tin_number' => '287-456-789-000', 'work_email' => 'jrt@amkor.ph', 'mobile_number' => '09171234567',
                'sil_total' => 15, 'sil_used' => 8, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Dalle', 'last_name' => 'Reyes', 'middle_name' => null,
                'suffix' => null, 'date_of_birth' => '1990-07-22', 'gender' => 'Male', 'civil_status' => 'Single',
                'employee_code' => 'EMP-002', 'position' => 'Disbursement Officer', 'department' => 'Finance',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2020-03-01', 'regularization_date' => '2020-09-01',
                'tin_number' => '287-654-321-000', 'work_email' => 'dalle@amkor.ph', 'mobile_number' => '09171234568',
                'sil_total' => 15, 'sil_used' => 5, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'dalle@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Jhona', 'last_name' => 'Ramos', 'middle_name' => 'Santos',
                'suffix' => null, 'date_of_birth' => '1988-11-10', 'gender' => 'Female', 'civil_status' => 'Married',
                'employee_code' => 'EMP-003', 'position' => 'RESA Officer', 'department' => 'Reservation',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2019-01-15', 'regularization_date' => '2019-07-15',
                'tin_number' => '287-789-123-000', 'work_email' => 'jhona@amkor.ph', 'mobile_number' => '09171234569',
                'sil_total' => 15, 'sil_used' => 10, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'jhona@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Maria', 'last_name' => 'Santos', 'middle_name' => 'Cruz',
                'suffix' => null, 'date_of_birth' => '1982-05-03', 'gender' => 'Female', 'civil_status' => 'Married',
                'employee_code' => 'EMP-004', 'position' => 'Chief Operations Officer', 'department' => 'Executive',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2017-06-01', 'regularization_date' => '2017-12-01',
                'tin_number' => '287-321-654-000', 'work_email' => 'coo@amkor.ph', 'mobile_number' => '09171234570',
                'sil_total' => 15, 'sil_used' => 6, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'coo@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Ricardo', 'last_name' => 'Lim', 'middle_name' => 'Garcia',
                'suffix' => null, 'date_of_birth' => '1983-09-18', 'gender' => 'Male', 'civil_status' => 'Single',
                'employee_code' => 'EMP-005', 'position' => 'General Sales Manager', 'department' => 'Operations',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2018-01-10', 'regularization_date' => '2018-07-10',
                'tin_number' => '287-987-654-000', 'work_email' => 'gsm@amkor.ph', 'mobile_number' => '09171234571',
                'sil_total' => 15, 'sil_used' => 3, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'gsm@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Anna', 'last_name' => 'Dela Cruz', 'middle_name' => 'Bautista',
                'suffix' => null, 'date_of_birth' => '1991-02-28', 'gender' => 'Female', 'civil_status' => 'Single',
                'employee_code' => 'EMP-006', 'position' => 'Accounting Officer', 'department' => 'Finance',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2020-06-15', 'regularization_date' => '2020-12-15',
                'tin_number' => '287-111-222-000', 'work_email' => 'accounting@amkor.ph', 'mobile_number' => '09171234572',
                'sil_total' => 15, 'sil_used' => 7, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'accounting@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Pedro', 'last_name' => 'Mendoza', 'middle_name' => 'Villanueva',
                'suffix' => null, 'date_of_birth' => '1987-06-12', 'gender' => 'Male', 'civil_status' => 'Married',
                'employee_code' => 'EMP-007', 'position' => 'Admin Auditor', 'department' => 'Finance',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2019-09-01', 'regularization_date' => '2020-03-01',
                'tin_number' => '287-333-444-000', 'work_email' => 'auditor@amkor.ph', 'mobile_number' => '09171234573',
                'sil_total' => 15, 'sil_used' => 4, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'auditor@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Lourdes', 'last_name' => 'Fernandez', 'middle_name' => 'Ramos',
                'suffix' => null, 'date_of_birth' => '1989-12-05', 'gender' => 'Female', 'civil_status' => 'Married',
                'employee_code' => 'EMP-008', 'position' => 'HR & Admin Officer', 'department' => 'Operations',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2020-01-15', 'regularization_date' => '2020-07-15',
                'tin_number' => '287-555-666-000', 'work_email' => 'hradmin@amkor.ph', 'mobile_number' => '09171234574',
                'sil_total' => 15, 'sil_used' => 9, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'hradmin@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Roberto', 'last_name' => 'Gonzales', 'middle_name' => 'Aquino',
                'suffix' => null, 'date_of_birth' => '1986-04-20', 'gender' => 'Male', 'civil_status' => 'Single',
                'employee_code' => 'EMP-009', 'position' => 'Liaison Officer', 'department' => 'Operations',
                'branch_id' => $qcMain, 'employment_status' => 'regular', 'date_hired' => '2019-03-01', 'regularization_date' => '2019-09-01',
                'tin_number' => '287-777-888-000', 'work_email' => 'liaison@amkor.ph', 'mobile_number' => '09171234575',
                'sil_total' => 15, 'sil_used' => 2, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'liaison@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Gloria', 'last_name' => 'Macalintal', 'middle_name' => 'Torres',
                'suffix' => null, 'date_of_birth' => '1984-08-08', 'gender' => 'Female', 'civil_status' => 'Married',
                'employee_code' => 'EMP-010', 'position' => 'Ormoc Branch Officer', 'department' => 'Ormoc',
                'branch_id' => $ormoc, 'employment_status' => 'regular', 'date_hired' => '2018-06-01', 'regularization_date' => '2018-12-01',
                'tin_number' => '287-999-000-000', 'work_email' => 'ormoc@amkor.ph', 'mobile_number' => '09171234576',
                'sil_total' => 15, 'sil_used' => 6, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'ormoc@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Catherine', 'last_name' => 'Rivera', 'middle_name' => 'Santiago',
                'suffix' => null, 'date_of_birth' => '1993-01-25', 'gender' => 'Female', 'civil_status' => 'Single',
                'employee_code' => 'EMP-011', 'position' => 'Visa Documentation Officer', 'department' => 'Visa',
                'branch_id' => $visaCentre, 'employment_status' => 'regular', 'date_hired' => '2021-02-01', 'regularization_date' => '2021-08-01',
                'tin_number' => '287-222-333-000', 'work_email' => 'visa@amkor.ph', 'mobile_number' => '09171234577',
                'sil_total' => 15, 'sil_used' => 5, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-01-15',
                'user_id' => DB::table('users')->where('email', 'visa@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'first_name' => 'Michelle', 'last_name' => 'Tan', 'middle_name' => 'Lee',
                'suffix' => null, 'date_of_birth' => '1992-10-30', 'gender' => 'Female', 'civil_status' => 'Single',
                'employee_code' => 'EMP-012', 'position' => 'Marketing Officer', 'department' => 'Marketing',
                'branch_id' => $qcMain, 'employment_status' => 'probationary', 'date_hired' => '2026-03-01', 'regularization_date' => null,
                'tin_number' => null, 'work_email' => 'marketing@amkor.ph', 'mobile_number' => '09171234578',
                'sil_total' => 5, 'sil_used' => 0, 'data_privacy_consent' => true, 'data_privacy_consent_date' => '2026-03-01',
                'user_id' => DB::table('users')->where('email', 'marketing@amkor.ph')->value('id'),
                'created_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'updated_by' => DB::table('users')->where('email', 'jrt@amkor.ph')->value('id'),
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($employees as $emp) {
            DB::table('employees')->updateOrInsert(
                ['employee_code' => $emp['employee_code']],
                $emp
            );
        }
    }
}
