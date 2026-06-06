<?php

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Attendance\Http\Requests\ClockRequest;
use Modules\Attendance\Http\Requests\StoreAttendanceRequest;
use Modules\Attendance\Models\AttendanceRecord;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    // ── Role constants (from Roles.md) ────────────────────────────────────────
    private const HR_ROLES    = ['hr_admin_officer', 'general_manager'];
    private const VIEW_ALL    = ['hr_admin_officer', 'general_manager', 'admin_auditor'];

    // ════════════════════════════════════════════════════════════════════════
    // INDEX — HR/Auditor/JRT: full table with filters + stats
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $user   = $request->user();
        $role   = $user?->getRoleNames()->first();
        $isHr   = in_array($role, self::VIEW_ALL, true);

        // Employees can only see their own records
        if (! $isHr) {
            return $this->selfView($request);
        }

        $month    = (int) $request->get('month', now()->month);
        $year     = (int) $request->get('year', now()->year);
        $empId    = $request->get('employee_id');
        $branchId = $request->get('branch_id');
        $status   = $request->get('status');
        $search   = $request->get('search');

        $query = AttendanceRecord::with(['user', 'branch', 'recordedBy'])
            ->forMonth($year, $month)
            ->forStatus($status)
            ->forBranch($branchId ?: null)
            ->orderBy('work_date', 'desc')
            ->orderBy('employee_id');

        if ($empId) {
            $query->forEmployee((int) $empId);
        }

        if ($search) {
            // Search by user name via join — cross-module safe (uses users table only)
            $query->whereHas('user', fn($q) =>
                $q->where(DB::raw("LOWER(name)"), 'like', '%' . strtolower($search) . '%')
            );
        }

        // Branch-scope: HR Admin and Auditor see all; others see their branch
        if ($role !== 'general_manager') {
            $query->forBranch($user->branch_id);
        }

        $records = $query->paginate(30)->withQueryString();

        // Summary stats for the selected month
        $statsBase = AttendanceRecord::forMonth($year, $month);
        if ($role !== 'general_manager' && $branchId) {
            $statsBase->forBranch((int) $branchId);
        }

        $stats = [
            'total_present'   => (clone $statsBase)->where('status', 'present')->count(),
            'total_absent'    => (clone $statsBase)->where('status', 'absent')->count(),
            'total_half_day'  => (clone $statsBase)->where('status', 'half_day')->count(),
            'total_on_leave'  => (clone $statsBase)->where('status', 'on_leave')->count(),
            'total_late'      => (clone $statsBase)->where('minutes_late', '>', 0)->count(),
            'total_undertime' => (clone $statsBase)->where('minutes_undertime', '>', 0)->count(),
        ];

        // Today's clock-in status for the current user (shown in the top banner)
        $todayRecord = AttendanceRecord::forEmployee($user->id)
            ->forDate(today()->toDateString())
            ->first();

        $branches  = \App\Models\Branch::orderBy('name')->get(['id', 'name', 'code']);
        $employees = \App\Models\User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Attendance/Index', [
            'records'     => $records,
            'stats'       => $stats,
            'filters'     => compact('month', 'year', 'empId', 'branchId', 'status', 'search'),
            'todayRecord' => $todayRecord,
            'statuses'    => AttendanceRecord::STATUSES,
            'leaveTypes'  => AttendanceRecord::LEAVE_TYPES,
            'branches'    => $branches,
            'employees'   => $employees,
            'canManage'   => $this->canManage($request),
            'currentUser' => ['id' => $user->id, 'name' => $user->name],
            'now'         => now()->toIso8601String(),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SELF VIEW — employees see only their own records
    // ════════════════════════════════════════════════════════════════════════

    private function selfView(Request $request): Response
    {
        $user  = $request->user();
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);

        $records = AttendanceRecord::forEmployee($user->id)
            ->forMonth($year, $month)
            ->orderBy('work_date', 'desc')
            ->get();

        $todayRecord = AttendanceRecord::forEmployee($user->id)
            ->forDate(today()->toDateString())
            ->first();

        // Personal stats for the month
        $stats = [
            'total_present'   => $records->where('status', 'present')->count(),
            'total_absent'    => $records->where('status', 'absent')->count(),
            'total_half_day'  => $records->where('status', 'half_day')->count(),
            'total_on_leave'  => $records->where('status', 'on_leave')->count(),
            'total_late'      => $records->where('minutes_late', '>', 0)->count(),
            'total_undertime' => $records->where('minutes_undertime', '>', 0)->count(),
            'minutes_late'    => $records->sum('minutes_late'),
            'minutes_undertime' => $records->sum('minutes_undertime'),
        ];

        return Inertia::render('Attendance/Self', [
            'records'     => $records,
            'stats'       => $stats,
            'todayRecord' => $todayRecord,
            'filters'     => compact('month', 'year'),
            'statuses'    => AttendanceRecord::STATUSES,
            'leaveTypes'  => AttendanceRecord::LEAVE_TYPES,
            'currentUser' => ['id' => $user->id, 'name' => $user->name],
            'now'         => now()->toIso8601String(),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHOW — single record detail
    // ════════════════════════════════════════════════════════════════════════

    public function show(Request $request, AttendanceRecord $attendance): Response
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();

        // Employees can only view their own records
        if (! in_array($role, self::VIEW_ALL, true) && $attendance->user_id !== $user->id) {
            abort(403, 'You can only view your own attendance records.');
        }

        $attendance->load(['user', 'branch', 'recordedBy']);

        return Inertia::render('Attendance/Show', [
            'record'    => array_merge($attendance->toArray(), [
                'hours_worked' => $attendance->hours_worked,
                'is_clocked_in' => $attendance->is_clocked_in,
            ]),
            'statuses'  => AttendanceRecord::STATUSES,
            'leaveTypes'=> AttendanceRecord::LEAVE_TYPES,
            'canManage' => $this->canManage($request),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLOCK IN — employee self-service
    // ════════════════════════════════════════════════════════════════════════

    public function clockIn(Request $request): RedirectResponse
    {
        $user = $request->user();
        $today = today()->toDateString();

        $existing = AttendanceRecord::where('employee_id', $user->id)
            ->where('work_date', $today)
            ->first();

        if ($existing) {
            return back()->with('flash', ['type' => 'error', 'message' => 'You have already clocked in today.']);
        }

        $now        = now();
        $timeIn     = $now->format('H:i:s');
        $lateMin    = AttendanceRecord::computeLateMinutes($timeIn);

        AttendanceRecord::create([
            'employee_id'  => $user->id,
            'user_id'      => $user->id,
            'work_date'    => $today,
            'time_in'      => $timeIn,
            'time_in_at'   => $now,
            'minutes_late' => $lateMin,
            'status'       => 'present',
            'ip_address'   => $request->ip(),
            'device_info'  => substr($request->userAgent() ?? '', 0, 255),
            'branch_id'    => $user->branch_id ?? null,
            'recorded_by'  => $user->id,
        ]);

        $msg = $lateMin > 0
            ? "Clocked in at {$now->format('h:i A')} — {$lateMin} min late."
            : "Clocked in at {$now->format('h:i A')}. Have a great day!";

        return back()->with('flash', ['type' => 'success', 'message' => $msg]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLOCK OUT — employee self-service
    // ════════════════════════════════════════════════════════════════════════

    public function clockOut(Request $request): RedirectResponse
    {
        $user = $request->user();
        $today = today()->toDateString();

        $record = AttendanceRecord::where('employee_id', $user->id)
            ->where('work_date', $today)
            ->whereNotNull('time_in')
            ->whereNull('time_out')
            ->first();

        if (! $record) {
            return back()->with('flash', ['type' => 'error', 'message' => 'No active clock-in found for today.']);
        }

        $now        = now();
        $timeOut    = $now->format('H:i:s');
        $underMin   = AttendanceRecord::computeUndertimeMinutes($timeOut);
        $worked     = AttendanceRecord::computeMinutesWorked($record->time_in, $timeOut);

        $record->update([
            'time_out'           => $timeOut,
            'time_out_at'        => $now,
            'minutes_worked'     => $worked,
            'minutes_undertime'  => $underMin,
            'updated_by'         => $user->id,
        ]);

        $h = intdiv($worked, 60);
        $m = $worked % 60;
        $workedStr = $m > 0 ? "{$h}h {$m}m" : "{$h}h";

        return back()->with('flash', ['type' => 'success', 'message' => "Clocked out at {$now->format('h:i A')}. Total: {$workedStr}."]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // HR OVERRIDE — HR or JRT can create/edit any record
    // ════════════════════════════════════════════════════════════════════════

    public function create(Request $request): Response
    {
        $this->requireHr($request);

        $employees = \App\Models\User::orderBy('name')->get(['id', 'name']);
        $branches  = \App\Models\Branch::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Attendance/Form', [
            'record'    => null,
            'employees' => $employees,
            'branches'  => $branches,
            'statuses'  => AttendanceRecord::STATUSES,
            'leaveTypes'=> AttendanceRecord::LEAVE_TYPES,
        ]);
    }

    public function store(StoreAttendanceRequest $request): RedirectResponse
    {
        $this->requireHr($request);

        $data = $request->validated();
        $data['recorded_by']  = $request->user()->id;
        $data['updated_by']   = $request->user()->id;
        $data['hr_override']  = true;
        $data['override_reason'] = $data['override_reason'] ?? 'HR manual entry';

        // Compute derived fields if time_in and time_out provided
        if (! empty($data['time_in']) && ! empty($data['time_out'])) {
            $data['minutes_worked']    = AttendanceRecord::computeMinutesWorked($data['time_in'], $data['time_out']);
            $data['minutes_undertime'] = AttendanceRecord::computeUndertimeMinutes($data['time_out']);
        }
        if (! empty($data['time_in'])) {
            $data['minutes_late'] = AttendanceRecord::computeLateMinutes($data['time_in']);
        }

        $record = AttendanceRecord::create($data);

        return redirect()
            ->route('attendance.show', $record)
            ->with('flash', ['type' => 'success', 'message' => 'Attendance record created.']);
    }

    public function edit(Request $request, AttendanceRecord $attendance): Response
    {
        $this->requireHr($request);

        $attendance->load(['user', 'branch']);
        $employees = \App\Models\User::orderBy('name')->get(['id', 'name']);
        $branches  = \App\Models\Branch::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Attendance/Form', [
            'record'    => array_merge($attendance->toArray(), [
                'hours_worked'  => $attendance->hours_worked,
                'is_clocked_in' => $attendance->is_clocked_in,
            ]),
            'employees' => $employees,
            'branches'  => $branches,
            'statuses'  => AttendanceRecord::STATUSES,
            'leaveTypes'=> AttendanceRecord::LEAVE_TYPES,
        ]);
    }

    public function update(StoreAttendanceRequest $request, AttendanceRecord $attendance): RedirectResponse
    {
        $this->requireHr($request);

        $data = $request->validated();
        $data['updated_by']      = $request->user()->id;
        $data['hr_override']     = true;
        if (empty($data['override_reason'])) {
            $data['override_reason'] = 'HR correction';
        }

        // Re-compute derived fields
        if (! empty($data['time_in']) && ! empty($data['time_out'])) {
            $data['minutes_worked']    = AttendanceRecord::computeMinutesWorked($data['time_in'], $data['time_out']);
            $data['minutes_undertime'] = AttendanceRecord::computeUndertimeMinutes($data['time_out']);
        }
        if (! empty($data['time_in'])) {
            $data['minutes_late'] = AttendanceRecord::computeLateMinutes($data['time_in']);
        }

        $attendance->update($data);

        return redirect()
            ->route('attendance.show', $attendance)
            ->with('flash', ['type' => 'success', 'message' => 'Attendance record updated.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DESTROY (soft delete — JRT only)
    // ════════════════════════════════════════════════════════════════════════

    public function destroy(Request $request, AttendanceRecord $attendance): RedirectResponse
    {
        if ($request->user()?->getRoleNames()->first() !== 'general_manager') {
            abort(403, 'Only the General Manager can remove attendance records.');
        }

        $attendance->delete();

        return redirect()
            ->route('attendance.index')
            ->with('flash', ['type' => 'success', 'message' => 'Attendance record removed (soft-deleted).']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // REPORT — monthly summary per employee (HR + JRT + Auditor)
    // ════════════════════════════════════════════════════════════════════════

    public function report(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ALL, true)) {
            abort(403, 'Access denied.');
        }

        $month    = (int) $request->get('month', now()->month);
        $year     = (int) $request->get('year', now()->year);
        $branchId = $request->get('branch_id');

        // Build per-employee summary for the month
        $query = AttendanceRecord::select([
                'employee_id',
                'user_id',
                'branch_id',
                DB::raw('COUNT(*) as total_days'),
                DB::raw("SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as days_present"),
                DB::raw("SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as days_absent"),
                DB::raw("SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as days_half"),
                DB::raw("SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as days_leave"),
                DB::raw("SUM(CASE WHEN status = 'holiday' THEN 1 ELSE 0 END) as days_holiday"),
                DB::raw('SUM(minutes_worked) as total_minutes_worked'),
                DB::raw('SUM(minutes_late) as total_minutes_late'),
                DB::raw('SUM(minutes_undertime) as total_minutes_undertime'),
            ])
            ->forMonth($year, $month)
            ->groupBy('employee_id', 'user_id', 'branch_id')
            ->with(['user:id,name', 'branch:id,name,code']);

        if ($branchId) {
            $query->forBranch((int) $branchId);
        } elseif ($role !== 'general_manager') {
            $query->forBranch($request->user()->branch_id);
        }

        $summary  = $query->get();
        $branches = \App\Models\Branch::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Attendance/Report', [
            'summary'   => $summary,
            'filters'   => compact('month', 'year', 'branchId'),
            'branches'  => $branches,
            'canExport' => in_array($role, self::VIEW_ALL, true),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private function requireHr(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::HR_ROLES, true)) {
            abort(403, 'Only the HR & Admin Officer or General Manager can manage attendance records.');
        }
    }

    private function canManage(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::HR_ROLES, true);
    }
}
