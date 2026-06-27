<?php

namespace Modules\Overtime\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Attendance\Models\AttendanceRecord;
use Modules\EmployeeRecords\Models\Employee;
use Modules\Overtime\Events\OvertimeRequestApproved;
use Modules\Overtime\Events\OvertimeRequestFiled;
use Modules\Overtime\Events\OvertimeRequestRejected;
use Modules\Overtime\Models\OvertimeRequest;

class OvertimeController extends Controller
{
    // ── Role constants ────────────────────────────────────────────────────────

    private const HR_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
    ];

    private const CAN_APPROVE_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'branch_supervisor',
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function userRole(): ?string
    {
        return Auth::user()?->getRoleNames()->first();
    }

    private function isHr(): bool
    {
        return in_array($this->userRole(), self::HR_ROLES, true);
    }

    private function canApprove(): bool
    {
        return in_array($this->userRole(), self::CAN_APPROVE_ROLES, true);
    }

    private function authEmployee(): ?Employee
    {
        return Employee::where('user_id', Auth::id())->first();
    }

    private function resolveApprover(Employee $employee): ?User
    {
        return User::role(self::CAN_APPROVE_ROLES)
            ->where('id', '!=', Auth::id())
            ->first();
    }

    /**
     * Compute minutes between two time strings (HH:MM or HH:MM:SS).
     */
    private function computeMinutes(string $start, string $end): int
    {
        $s = Carbon::parse($start);
        $e = Carbon::parse($end);

        // Handle overnight OT (end < start)
        if ($e->lt($s)) {
            $e->addDay();
        }

        return (int) $s->diffInMinutes($e);
    }

    // ════════════════════════════════════════════════════════════════════════
    // INDEX
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $role         = $this->userRole();
        $isHr         = $this->isHr();
        $isSupervisor = $role === 'branch_supervisor';

        // ── Employee self-view ──────────────────────────────────────────────
        if (! $isHr && ! $isSupervisor) {
            $employee = $this->authEmployee();

            $status = $request->get('status');
            $query  = OvertimeRequest::with(['approver', 'rejector'])
                ->where('employee_id', $employee?->id ?? 0)
                ->orderBy('work_date', 'desc');

            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            $requests = $query->get()->map(fn ($r) => $this->formatRequest($r));

            $approver = $employee ? $this->resolveApprover($employee) : null;

            return Inertia::render('Overtime/Index', [
                'requests'      => $requests,
                'canManage'     => false,
                'canApproveOt'  => false,
                'approver'      => $approver ? [
                    'name' => $approver->name,
                    'role' => $approver->getRoleNames()->first(),
                ] : null,
                'filters'       => ['status' => $status],
                'highlight'     => $request->get('highlight'),
                'reasons'       => OvertimeRequest::REASONS,
                'compensations' => OvertimeRequest::COMPENSATION_TYPES,
                'requestTypes'  => OvertimeRequest::REQUEST_TYPES,
            ]);
        }

        // ── HR / supervisor view ────────────────────────────────────────────
        $status           = $request->get('status');
        $branchId         = $request->get('branch_id');
        $employeeId       = $request->get('employee_id');
        $compensationType = $request->get('compensation_type');
        $month            = $request->get('month');
        $year             = $request->get('year', now()->year);
        $search           = $request->get('search');

        $query = OvertimeRequest::with(['employee.branch', 'approver', 'rejector', 'requestedFor'])
            ->orderBy('work_date', 'desc');

        // Branch supervisor: scope to own branch only
        if ($isSupervisor && ! $isHr) {
            $emp = $this->authEmployee();
            if ($emp?->branch_id) {
                $query->whereHas('employee', fn ($q) => $q->where('branch_id', $emp->branch_id));
            }
        } elseif ($branchId) {
            $query->whereHas('employee', fn ($q) => $q->where('branch_id', $branchId));
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        if ($compensationType) {
            $query->where('compensation_type', $compensationType);
        }

        if ($month) {
            $query->whereMonth('work_date', $month)->whereYear('work_date', $year);
        }

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%");
            });
        }

        $requests = $query->paginate(25)->through(fn ($r) => $this->formatRequest($r));

        $branches  = Branch::orderBy('name')->get(['id', 'name']);
        $employees = Employee::active()->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'employee_code']);

        // Pending count for badge
        $pendingCount = OvertimeRequest::where('status', 'pending')
            ->when($isSupervisor && ! $isHr, function ($q) {
                $emp = $this->authEmployee();
                if ($emp?->branch_id) {
                    $q->whereHas('employee', fn ($q2) => $q2->where('branch_id', $emp->branch_id));
                }
            })
            ->count();

        return Inertia::render('Overtime/Index', [
            'requests'        => $requests,
            'pendingCount'    => $pendingCount,
            'canManage'       => true,
            'canApproveOt'    => $this->canApprove(),
            'branches'        => $branches,
            'employees'       => $employees,
            'reasons'         => OvertimeRequest::REASONS,
            'compensations'   => OvertimeRequest::COMPENSATION_TYPES,
            'requestTypes'    => OvertimeRequest::REQUEST_TYPES,
            'filters'         => compact('status', 'branchId', 'employeeId', 'compensationType', 'month', 'year', 'search'),
            'highlight'       => $request->get('highlight'),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // STORE
    // ════════════════════════════════════════════════════════════════════════

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id'      => 'nullable|exists:employees,id',
            'requested_for'    => 'nullable|exists:employees,id',
            'work_date'        => 'required|date',
            'ot_start_time'    => 'required|date_format:H:i',
            'ot_end_time'      => 'required|date_format:H:i',
            'reason'           => 'required|in:' . implode(',', array_keys(OvertimeRequest::REASONS)),
            'compensation_type'=> 'required|in:pay,leave_credit',
            'remarks'          => 'nullable|string|max:1000',
            'attachment'       => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'request_type'     => 'nullable|in:standard,pre_approved,on_behalf',
        ]);

        $requestType = $data['request_type'] ?? 'standard';

        // Resolve the filing employee
        $employee = ($this->isHr() || $this->userRole() === 'branch_supervisor') && ! empty($data['employee_id'])
            ? Employee::findOrFail($data['employee_id'])
            : $this->authEmployee();

        abort_unless($employee, 403, 'No employee record found for this user.');

        // For "on_behalf", validate the target is in the approver's branch
        $requestedFor = null;
        if ($requestType === 'on_behalf') {
            abort_unless($this->canApprove(), 403, 'You do not have permission to file OT on behalf of others.');

            $requestedFor = Employee::findOrFail($data['requested_for'] ?? 0);

            if (! $this->isHr()) {
                $authEmp = $this->authEmployee();
                abort_unless(
                    $authEmp && $requestedFor->branch_id === $authEmp->branch_id,
                    403,
                    'You can only file on behalf of employees in your branch.'
                );
            }
        }

        $minutes = $this->computeMinutes($data['ot_start_time'], $data['ot_end_time']);
        abort_if($minutes <= 0, 422, 'OT end time must be after OT start time.');

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('overtime-attachments', 'private');
        }

        $overtimeRequest = OvertimeRequest::create([
            'employee_id'      => $employee->id,
            'work_date'        => $data['work_date'],
            'ot_start_time'    => $data['ot_start_time'],
            'ot_end_time'      => $data['ot_end_time'],
            'minutes_requested'=> $minutes,
            'reason'           => $data['reason'],
            'compensation_type'=> $data['compensation_type'],
            'remarks'          => $data['remarks'] ?? null,
            'attachment_path'  => $attachmentPath,
            'status'           => 'pending',
            'request_type'     => $requestType,
            'requested_for'    => $requestedFor?->id,
            'created_by'       => Auth::id(),
        ]);

        event(new OvertimeRequestFiled($overtimeRequest));

        return redirect()->route('overtime.index')
            ->with('success', 'Overtime request submitted.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // APPROVE
    // ════════════════════════════════════════════════════════════════════════

    public function approve(OvertimeRequest $overtime): RedirectResponse
    {
        abort_unless($this->canApprove(), 403);
        abort_unless($overtime->status === 'pending', 422, 'Only pending requests can be approved.');

        $overtime->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'updated_by'  => Auth::id(),
        ]);

        event(new OvertimeRequestApproved($overtime));

        return back()->with('success', 'Overtime request approved.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // REJECT
    // ════════════════════════════════════════════════════════════════════════

    public function reject(Request $request, OvertimeRequest $overtime): RedirectResponse
    {
        abort_unless($this->canApprove(), 403);
        abort_unless($overtime->status === 'pending', 422, 'Only pending requests can be rejected.');

        $data = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $overtime->update([
            'status'           => 'rejected',
            'rejected_by'      => Auth::id(),
            'rejection_reason' => $data['rejection_reason'],
            'updated_by'       => Auth::id(),
        ]);

        event(new OvertimeRequestRejected($overtime));

        return back()->with('success', 'Overtime request rejected.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // CANCEL
    // ════════════════════════════════════════════════════════════════════════

    public function cancel(OvertimeRequest $overtime): RedirectResponse
    {
        $employee = $this->authEmployee();

        abort_unless(
            $overtime->employee_id === $employee?->id && $overtime->status === 'pending',
            403,
            'You cannot cancel this request.'
        );

        $overtime->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
            'updated_by'   => Auth::id(),
        ]);

        return back()->with('success', 'Overtime request cancelled.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // DESTROY
    // ════════════════════════════════════════════════════════════════════════

    public function destroy(OvertimeRequest $overtime): RedirectResponse
    {
        abort_unless($this->isHr(), 403);
        $overtime->delete();

        return redirect()->route('overtime.index')
            ->with('success', 'Overtime request deleted.');
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function formatRequest(OvertimeRequest $r): array
    {
        return [
            'id'                   => $r->id,
            'work_date'            => $r->work_date?->toDateString(),
            'ot_start_time'        => $r->ot_start_time,
            'ot_end_time'          => $r->ot_end_time,
            'minutes_requested'    => $r->minutes_requested,
            'duration_label'       => $r->duration_label,
            'reason'               => $r->reason,
            'reason_label'         => OvertimeRequest::REASONS[$r->reason] ?? $r->reason,
            'compensation_type'    => $r->compensation_type,
            'compensation_label'   => OvertimeRequest::COMPENSATION_TYPES[$r->compensation_type] ?? $r->compensation_type,
            'remarks'              => $r->remarks,
            'status'               => $r->status,
            'request_type'         => $r->request_type,
            'created_at'           => $r->created_at?->toDateString(),
            'approved_by_name'     => $r->approver?->name,
            'approved_at'          => $r->approved_at?->toDateString(),
            'rejected_by_name'     => $r->rejector?->name,
            'rejection_reason'     => $r->rejection_reason,
            'cancelled_at'         => $r->cancelled_at?->toDateString(),
            'employee'             => $r->employee ? [
                'id'            => $r->employee->id,
                'display_name'  => $r->employee->display_name,
                'employee_code' => $r->employee->employee_code,
                'branch_name'   => $r->employee->branch?->name,
            ] : null,
            'requested_for_name'   => $r->requestedFor?->display_name,
        ];
    }
}
