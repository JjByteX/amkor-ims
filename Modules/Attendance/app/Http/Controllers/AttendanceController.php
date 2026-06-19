<?php

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Attendance\Http\Requests\StoreAttendanceRequest;
use Modules\Attendance\Models\AttendanceRecord;

class AttendanceController extends Controller
{
    // ── Role constants ────────────────────────────────────────────────────────
    // Module 15: president + COO have full update; finance_admin_supervisor is primary owner.
    private const HR_ROLES = ['president', 'chief_operating_officer', 'finance_admin_supervisor'];

    // Roles that see the full attendance table (not just own records).
    // Team-scoped roles (general_sales_manager, business_development_manager,
    // visa_documentation_supervisor, branch_supervisor) are handled via branch/dept
    // scoping in the index query rather than here.
    private const VIEW_ALL = ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant'];

    // FIX #2 (Module 15): Team-scoped roles see their own team's attendance (🌿)
    private const TEAM_SCOPE_ROLES = [
        'general_sales_manager',          // own + QC Sales team
        'business_development_manager',   // own + Business Development / Marketing team
        'visa_documentation_supervisor',  // own + Visa & Documentation team
        'branch_supervisor',              // own + Ormoc branch team
    ];

    // ════════════════════════════════════════════════════════════════════════
    // INDEX — HR/Auditor: full table with filters + stats
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();
        $isHr = in_array($role, self::VIEW_ALL, true);
        $isTeamScoped = in_array($role, self::TEAM_SCOPE_ROLES, true);

        // Employees can only see their own records
        if (! $isHr && ! $isTeamScoped) {
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
            $query->whereHas('user', fn ($q) => $q->where(DB::raw('LOWER(name)'), 'like', '%'.strtolower($search).'%'));
        }

        // FIX #2: Branch/team scoping per Module 15
        // Team-scoped managers see their department/branch; HR see all
        if (in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor'], true)) {
            // See all branches — no scope applied
        } elseif ($role === 'administrative_assistant') {
            // Reads all for payroll support — no branch scope
        } elseif ($role === 'general_sales_manager') {
            // Own + QC Sales team: sales_reservation_officer, sales_ticketing_officer, group_sales_officer, GSM herself
            $salesRoles = ['sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer', 'general_sales_manager'];
            $query->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $salesRoles)));
        } elseif ($role === 'business_development_manager') {
            // Own + Business Development / Marketing team
            $bdmRoles = ['business_development_manager', 'sales_marketing_officer'];
            $query->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $bdmRoles)));
        } elseif ($role === 'visa_documentation_supervisor') {
            // Own + Visa & Documentation team
            $visaRoles = ['visa_documentation_supervisor', 'liaison_officer_visa', 'visa_documentation_officer'];
            $query->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $visaRoles)));
        } elseif ($role === 'branch_supervisor') {
            // Own + Ormoc branch team
            $query->forBranch($user->branch_id);
        } else {
            $query->forBranch($user->branch_id);
        }

        $records = $query->paginate(30)->withQueryString();

        // Summary stats for the selected month — now includes overtime + overbreak
        $statsBase = AttendanceRecord::forMonth($year, $month);
        if (! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor'], true) && $branchId) {
            $statsBase->forBranch((int) $branchId);
        }

        $stats = (clone $statsBase)->selectRaw("
            COUNT(CASE WHEN status = 'present' THEN 1 END)          as total_present,
            COUNT(CASE WHEN status = 'absent' THEN 1 END)           as total_absent,
            COUNT(CASE WHEN status = 'half_day' THEN 1 END)         as total_half_day,
            COUNT(CASE WHEN status = 'on_leave' THEN 1 END)         as total_on_leave,
            COUNT(CASE WHEN minutes_late > 0 THEN 1 END)            as total_late,
            COUNT(CASE WHEN minutes_undertime > 0 THEN 1 END)       as total_undertime,
            COUNT(CASE WHEN minutes_overtime > 0 THEN 1 END)        as total_overtime,
            COUNT(CASE WHEN minutes_overbreak > 0 THEN 1 END)       as total_overbreak,
            COALESCE(SUM(minutes_overtime), 0)                       as sum_overtime,
            COALESCE(SUM(minutes_overbreak), 0)                      as sum_overbreak
        ")->first();

        // Today's clock-in status for the current user (shown in the top banner)
        $todayRecord = AttendanceRecord::forEmployee($user->id)
            ->forDate(today()->toDateString())
            ->first();

        $branches  = Branch::orderBy('name')->get(['id', 'name', 'code']);
        $employees = User::orderBy('name')->get(['id', 'name']);

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

        $stats = [
            'total_present'       => $records->where('status', 'present')->count(),
            'total_absent'        => $records->where('status', 'absent')->count(),
            'total_half_day'      => $records->where('status', 'half_day')->count(),
            'total_on_leave'      => $records->where('status', 'on_leave')->count(),
            'total_late'          => $records->where('minutes_late', '>', 0)->count(),
            'total_undertime'     => $records->where('minutes_undertime', '>', 0)->count(),
            'total_overtime'      => $records->where('minutes_overtime', '>', 0)->count(),
            'total_overbreak'     => $records->where('minutes_overbreak', '>', 0)->count(),
            'minutes_late'        => $records->sum('minutes_late'),
            'minutes_undertime'   => $records->sum('minutes_undertime'),
            'minutes_overtime'    => $records->sum('minutes_overtime'),
            'minutes_overbreak'   => $records->sum('minutes_overbreak'),
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

    public function show(Request $request, AttendanceRecord $attendance): Response|JsonResponse
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();

        $isViewAll   = in_array($role, self::VIEW_ALL, true);
        $isOwnRecord = $attendance->user_id === $user->id;
        $isTeamRecord = $this->isWithinTeamScope($role, $user, $attendance);

        if (! $isViewAll && ! $isOwnRecord && ! $isTeamRecord) {
            abort(403, 'You can only view your own attendance records.');
        }

        $attendance->load(['user', 'branch', 'recordedBy']);

        $payload = [
            'record'    => array_merge($attendance->toArray(), [
                'hours_worked'  => $attendance->hours_worked,
                'is_clocked_in' => $attendance->is_clocked_in,
            ]),
            'statuses'   => AttendanceRecord::STATUSES,
            'leaveTypes' => AttendanceRecord::LEAVE_TYPES,
            'canManage'  => $this->canManage($request),
        ];

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json($payload);
        }

        return Inertia::render('Attendance/Show', $payload);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLOCK IN — employee self-service
    // ════════════════════════════════════════════════════════════════════════

    public function clockIn(Request $request): RedirectResponse
    {
        $user  = $request->user();
        $today = today()->toDateString();

        $existing = AttendanceRecord::where('employee_id', $user->id)
            ->where('work_date', $today)
            ->first();

        if ($existing) {
            return back()->with('flash', ['type' => 'error', 'message' => 'You have already clocked in today.']);
        }

        $now    = now();
        $timeIn = $now->format('H:i:s');
        $lateMin = AttendanceRecord::computeLateMinutes($timeIn);

        AttendanceRecord::create([
            'employee_id' => $user->id,
            'user_id'     => $user->id,
            'work_date'   => $today,
            'time_in'     => $timeIn,
            'time_in_at'  => $now,
            'minutes_late' => $lateMin,
            'status'      => 'present',
            'ip_address'  => $request->ip(),
            'device_info' => substr($request->userAgent() ?? '', 0, 255),
            'branch_id'   => $user->branch_id ?? null,
            'recorded_by' => $user->id,
        ]);

        $msg = $lateMin > 0
            ? "Clocked in at {$now->format('h:i A')} — {$lateMin} min late."
            : "Clocked in at {$now->format('h:i A')}. Have a great day!";

        return back()->with('flash', ['type' => 'success', 'message' => $msg]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLOCK OUT — employee self-service (now computes overtime too)
    // ════════════════════════════════════════════════════════════════════════

    public function clockOut(Request $request): RedirectResponse
    {
        $user  = $request->user();
        $today = today()->toDateString();

        $record = AttendanceRecord::where('employee_id', $user->id)
            ->where('work_date', $today)
            ->whereNotNull('time_in')
            ->whereNull('time_out')
            ->first();

        if (! $record) {
            return back()->with('flash', ['type' => 'error', 'message' => 'No active clock-in found for today.']);
        }

        $now     = now();
        $timeOut = $now->format('H:i:s');

        $record->update(array_merge(
            AttendanceRecord::computeCounters(
                $record->time_in,
                $timeOut,
                $record->break_start,
                $record->break_end
            ),
            [
                'time_out'    => $timeOut,
                'time_out_at' => $now,
                'updated_by'  => $user->id,
            ]
        ));

        $worked   = $record->fresh()->minutes_worked;
        $overtime = $record->fresh()->minutes_overtime;
        $h        = intdiv($worked, 60);
        $m        = $worked % 60;
        $workedStr = $m > 0 ? "{$h}h {$m}m" : "{$h}h";

        $msg = "Clocked out at {$now->format('h:i A')}. Total: {$workedStr}.";
        if ($overtime > 0) {
            $oh = intdiv($overtime, 60);
            $om = $overtime % 60;
            $otStr = $om > 0 ? "{$oh}h {$om}m" : "{$oh}h";
            $msg .= " Overtime: {$otStr}.";
        }

        return back()->with('flash', ['type' => 'success', 'message' => $msg]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // HR OVERRIDE — HR or GM can create/edit any record
    // ════════════════════════════════════════════════════════════════════════

    public function create(Request $request): Response
    {
        $this->requireHr($request);

        $employees = User::orderBy('name')->get(['id', 'name']);
        $branches  = Branch::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Attendance/Form', [
            'record'     => null,
            'employees'  => $employees,
            'branches'   => $branches,
            'statuses'   => AttendanceRecord::STATUSES,
            'leaveTypes' => AttendanceRecord::LEAVE_TYPES,
        ]);
    }

    public function store(StoreAttendanceRequest $request): RedirectResponse
    {
        $this->requireHr($request);

        $data = $request->validated();
        $data['recorded_by']    = $request->user()->id;
        $data['updated_by']     = $request->user()->id;
        $data['hr_override']    = true;
        $data['override_reason'] = $data['override_reason'] ?? 'HR manual entry';

        // Compute all counters when both time_in and time_out are provided
        if (! empty($data['time_in']) && ! empty($data['time_out'])) {
            $counters = AttendanceRecord::computeCounters(
                $data['time_in'],
                $data['time_out'],
                $data['break_start'] ?? null,
                $data['break_end']   ?? null
            );
            $data = array_merge($data, $counters);
        } elseif (! empty($data['time_in'])) {
            $data['minutes_late'] = AttendanceRecord::computeLateMinutes($data['time_in']);
        }

        $record = AttendanceRecord::create($data);

        return redirect()
            ->route('attendance.index')
            ->with('flash', ['type' => 'success', 'message' => 'Attendance record created.']);
    }

    public function edit(Request $request, AttendanceRecord $attendance): Response
    {
        $this->requireHr($request);

        $attendance->load(['user', 'branch']);
        $employees = User::orderBy('name')->get(['id', 'name']);
        $branches  = Branch::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Attendance/Form', [
            'record'     => array_merge($attendance->toArray(), [
                'hours_worked'  => $attendance->hours_worked,
                'is_clocked_in' => $attendance->is_clocked_in,
            ]),
            'employees'  => $employees,
            'branches'   => $branches,
            'statuses'   => AttendanceRecord::STATUSES,
            'leaveTypes' => AttendanceRecord::LEAVE_TYPES,
        ]);
    }

    public function update(StoreAttendanceRequest $request, AttendanceRecord $attendance): RedirectResponse
    {
        $this->requireHr($request);

        $data = $request->validated();
        $data['updated_by']  = $request->user()->id;
        $data['hr_override'] = true;
        if (empty($data['override_reason'])) {
            $data['override_reason'] = 'HR correction';
        }

        // Re-compute all counters
        if (! empty($data['time_in']) && ! empty($data['time_out'])) {
            $counters = AttendanceRecord::computeCounters(
                $data['time_in'],
                $data['time_out'],
                $data['break_start'] ?? null,
                $data['break_end']   ?? null
            );
            $data = array_merge($data, $counters);
        } elseif (! empty($data['time_in'])) {
            $data['minutes_late'] = AttendanceRecord::computeLateMinutes($data['time_in']);
        }

        $attendance->update($data);

        return redirect()
            ->route('attendance.index')
            ->with('flash', ['type' => 'success', 'message' => 'Attendance record updated.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DESTROY (soft delete — GM only)
    // ════════════════════════════════════════════════════════════════════════

    public function destroy(Request $request, AttendanceRecord $attendance): RedirectResponse
    {
        if ($request->user()?->getRoleNames()->first() !== 'president') {
            abort(403, 'Only the President can remove attendance records.');
        }

        $attendance->delete();

        return redirect()
            ->route('attendance.index')
            ->with('flash', ['type' => 'success', 'message' => 'Attendance record removed (soft-deleted).']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // REPORT — monthly summary per employee (HR + GM + Auditor)
    // ════════════════════════════════════════════════════════════════════════

    public function report(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, array_merge(self::VIEW_ALL, self::TEAM_SCOPE_ROLES), true)) {
            abort(403, 'Access denied.');
        }

        $month    = (int) $request->get('month', now()->month);
        $year     = (int) $request->get('year', now()->year);
        $branchId = $request->get('branch_id');

        $query = AttendanceRecord::select([
            'employee_id',
            'user_id',
            'branch_id',
            DB::raw('COUNT(*) as total_days'),
            DB::raw("SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)                  as days_present"),
            DB::raw("SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END)                   as days_absent"),
            DB::raw("SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END)                 as days_half"),
            DB::raw("SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END)                 as days_leave"),
            DB::raw("SUM(CASE WHEN status = 'holiday' THEN 1 ELSE 0 END)                  as days_holiday"),
            DB::raw('COALESCE(SUM(minutes_worked), 0)                                      as total_minutes_worked'),
            DB::raw('COALESCE(SUM(minutes_late), 0)                                        as total_minutes_late'),
            DB::raw('COALESCE(SUM(minutes_undertime), 0)                                   as total_minutes_undertime'),
            DB::raw('COALESCE(SUM(minutes_overtime), 0)                                    as total_minutes_overtime'),
            DB::raw('COALESCE(SUM(minutes_overbreak), 0)                                   as total_minutes_overbreak'),
        ])
            ->forMonth($year, $month)
            ->groupBy('employee_id', 'user_id', 'branch_id')
            ->with(['user:id,name', 'branch:id,name,code']);

        if ($branchId) {
            $query->forBranch((int) $branchId);
        } elseif (in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant'], true)) {
            // Full company view — no additional scope
        } elseif ($role === 'general_sales_manager') {
            $salesRoles = ['sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer', 'general_sales_manager'];
            $query->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $salesRoles)));
        } elseif ($role === 'business_development_manager') {
            $bdmRoles = ['business_development_manager', 'sales_marketing_officer'];
            $query->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $bdmRoles)));
        } elseif ($role === 'visa_documentation_supervisor') {
            $visaRoles = ['visa_documentation_supervisor', 'liaison_officer_visa', 'visa_documentation_officer'];
            $query->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $visaRoles)));
        } elseif ($role === 'branch_supervisor') {
            $query->forBranch($request->user()->branch_id);
        }

        $summary  = $query->get();
        $branches = Branch::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Attendance/Report', [
            'summary'   => $summary,
            'filters'   => compact('month', 'year', 'branchId'),
            'branches'  => $branches,
            'canExport' => in_array($role, array_merge(self::VIEW_ALL, self::TEAM_SCOPE_ROLES), true),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private function requireHr(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::HR_ROLES, true)) {
            abort(403, 'Only the Finance & Admin Supervisor, COO, or President can manage attendance records.');
        }
    }

    private function canManage(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::HR_ROLES, true);
    }

    /**
     * Returns true if the given attendance record belongs to a user
     * within the team-scoped manager's team (mirrors index() logic).
     */
    private function isWithinTeamScope(string $role, \App\Models\User $manager, AttendanceRecord $record): bool
    {
        if (! in_array($role, self::TEAM_SCOPE_ROLES, true)) {
            return false;
        }

        $employee = \App\Models\User::find($record->user_id);
        if (! $employee) {
            return false;
        }

        $employeeRole = $employee->getRoleNames()->first();

        return match ($role) {
            'general_sales_manager'         => in_array($employeeRole, ['sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer', 'general_sales_manager'], true),
            'business_development_manager'  => in_array($employeeRole, ['business_development_manager', 'sales_marketing_officer'], true),
            'visa_documentation_supervisor' => in_array($employeeRole, ['visa_documentation_supervisor', 'liaison_officer_visa', 'visa_documentation_officer'], true),
            'branch_supervisor'             => $employee->branch_id === $manager->branch_id,
            default                         => false,
        };
    }
}
