<?php

namespace Modules\Attendance\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttendanceDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now     = now();
        $qcMain  = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $ormoc   = DB::table('branches')->where('code', 'ORMOC')->value('id');

        // Judy Ann Gregorio is the HR/Admin person who records attendance
        $hradmin = DB::table('users')->where('email', 'judyann@amkor.ph')->value('id');

        // Employee list must match exactly:
        // - user_email  → users.email  (from AuthDatabaseSeeder)
        // - emp_code    → employees.employee_code (from EmployeeRecordsDatabaseSeeder)
        // - branch_code → branches.code
        // Note: EMP-009 (Liaison Officer) shares dalle@amkor.ph — that's correct
        // per the seeder. EMP-010 was never inserted in EmployeeRecordsDatabaseSeeder
        // (skipped) so it is not listed here either.
        $employees = [
            ['emp_code' => 'EMP-001', 'user_email' => 'jrt@amkor.ph',        'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-002', 'user_email' => 'dalle@amkor.ph',       'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-003', 'user_email' => 'jhona@amkor.ph',       'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-004', 'user_email' => 'marianne@amkor.ph',    'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-005', 'user_email' => 'rochelle@amkor.ph',    'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-006', 'user_email' => 'accounting1@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-007', 'user_email' => 'judyann@amkor.ph',     'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-008', 'user_email' => 'johnvic@amkor.ph',     'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-011', 'user_email' => 'alex@amkor.ph',        'branch_code' => 'QC_MAIN'],
            ['emp_code' => 'EMP-012', 'user_email' => 'jhoanna@amkor.ph',     'branch_code' => 'QC_MAIN'],
            // Ormoc Branch
            ['emp_code' => 'EMP-010', 'user_email' => 'anjelly@amkor.ph',     'branch_code' => 'ORMOC'],
            ['emp_code' => 'EMP-013', 'user_email' => 'ormoc1@amkor.ph',      'branch_code' => 'ORMOC'],
            ['emp_code' => 'EMP-014', 'user_email' => 'ormoc2@amkor.ph',      'branch_code' => 'ORMOC'],
            ['emp_code' => 'EMP-015', 'user_email' => 'ormoc3@amkor.ph',      'branch_code' => 'ORMOC'],
        ];

        $dates = ['2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06'];

        $statuses = ['present', 'present', 'present', 'present', 'half_day', 'on_leave', 'absent', 'late'];

        $records = [];

        foreach ($employees as $emp) {
            $userId  = DB::table('users')->where('email', $emp['user_email'])->value('id');
            $empId   = DB::table('employees')->where('employee_code', $emp['emp_code'])->value('id');
            $branchId = DB::table('branches')->where('code', $emp['branch_code'])->value('id');

            // Skip if the user or employee record wasn't seeded
            if (! $userId || ! $empId) {
                continue;
            }

            foreach ($dates as $date) {
                $status = $statuses[array_rand($statuses)];

                $timeIn = '08:00:00';
                $timeOut = '17:00:00';
                $minutesWorked = 540;
                $minutesLate = 0;
                $minutesUndertime = 0;

                if ($status === 'late') {
                    $timeIn = '08:30:00';
                    $minutesLate = 30;
                } elseif ($status === 'half_day') {
                    $timeOut = '13:00:00';
                    $minutesWorked = 300;
                    $minutesUndertime = 240;
                } elseif ($status === 'on_leave' || $status === 'absent') {
                    $timeIn = null;
                    $timeOut = null;
                    $minutesWorked = 0;
                }

                $leaveType = null;
                if ($status === 'on_leave') {
                    $leaveTypes = ['SIL', 'VL', 'SL', 'EL'];
                    $leaveType = $leaveTypes[array_rand($leaveTypes)];
                }

                $records[] = [
                    'employee_id' => $empId,
                    'user_id' => $userId,
                    'work_date' => $date,
                    'time_in' => $timeIn,
                    'time_out' => $timeOut,
                    'time_in_at' => $timeIn ? "{$date} {$timeIn}" : null,
                    'time_out_at' => $timeOut ? "{$date} {$timeOut}" : null,
                    'minutes_worked' => $minutesWorked,
                    'minutes_late' => $minutesLate,
                    'minutes_undertime' => $minutesUndertime,
                    'status' => $status,
                    'leave_type' => $leaveType,
                    'ip_address' => '192.168.1.'.rand(10, 250),
                    'device_info' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'hr_override' => false,
                    'branch_id' => $branchId,
                    'recorded_by' => $hradmin,
                    'updated_by' => $hradmin,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach ($records as $r) {
            DB::table('attendance_records')->insert($r);
        }
    }
}
