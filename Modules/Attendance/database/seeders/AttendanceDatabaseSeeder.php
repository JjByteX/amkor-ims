<?php

namespace Modules\Attendance\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttendanceDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $qcMain = DB::table('branches')->where('code', 'QC_MAIN')->value('id');
        $visaCentre = DB::table('branches')->where('code', 'VISA_CENTRE')->value('id');
        $ormoc = DB::table('branches')->where('code', 'ORMOC')->value('id');

        $hradmin = DB::table('users')->where('email', 'hradmin@amkor.ph')->value('id');

        $employees = [
            ['code' => 'EMP-001', 'user_email' => 'jrt@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-002', 'user_email' => 'dalle@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-003', 'user_email' => 'jhona@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-004', 'user_email' => 'coo@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-005', 'user_email' => 'gsm@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-006', 'user_email' => 'accounting@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-007', 'user_email' => 'auditor@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-008', 'user_email' => 'hradmin@amkor.ph', 'branch_code' => 'QC_MAIN'],
            ['code' => 'EMP-010', 'user_email' => 'ormoc@amkor.ph', 'branch_code' => 'ORMOC'],
            ['code' => 'EMP-011', 'user_email' => 'visa@amkor.ph', 'branch_code' => 'VISA_CENTRE'],
            ['code' => 'EMP-012', 'user_email' => 'marketing@amkor.ph', 'branch_code' => 'QC_MAIN'],
        ];

        $dates = ['2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06'];

        $statuses = ['present', 'present', 'present', 'present', 'half_day', 'on_leave', 'absent', 'late'];

        $records = [];

        foreach ($employees as $emp) {
            $userId = DB::table('users')->where('email', $emp['user_email'])->value('id');
            $empId = DB::table('employees')->where('employee_code', $emp['code'])->value('id');
            $branchId = DB::table('branches')->where('code', $emp['branch_code'])->value('id');

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
                    'ip_address' => '192.168.1.' . rand(10, 250),
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
