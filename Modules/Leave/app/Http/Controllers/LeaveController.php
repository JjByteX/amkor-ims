<?php

namespace Modules\Leave\Http\Controllers;

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
use Modules\EmployeeRecords\Models\Employee;
use Modules\Leave\Events\LeaveRequestApproved;
use Modules\Leave\Events\LeaveRequestFiled;
use Modules\Leave\Events\LeaveRequestRejected;
use Modules\Leave\Models\LeaveRequest;

class LeaveController extends Controller
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

    /**
     * Resolve the Employee record for the authenticated user.
     * Returns null if the user has no linked employee record.
     */
    private function authEmployee(): ?Employee
    {
        return Employee::where('user_id', Auth::id())->first();
    }

    /**
     * Determine the approver for a given employee's branch.
     * Returns the first finance_admin_supervisor or president found.
     */
    private function resolveApprover(Employee $employee): ?User
    {
        return User::role(self::CAN_APPROVE_ROLES)
            ->where('id', '!=', Auth::id())
            ->first();
    }

    /**
     * Compute business days between two dates (simple: exclude Sun).
     * Half-day is handled via the `session` field by the caller.
     */
    private function computeBusinessDays(Carbon $from, Carbon $to, string $session): float
    {
        if ($from->isSameDay($to)) {
            return ($session === 'full_day') ? 1.0 : 0.5;
        }

        $days = 0;
        $current = $from->copy();
        while ($current->lte($to)) {
            if (! $current->isSunday()) {
                $days++;
            }
            $current->addDay();
        }

        return (float) $days;
    }

    // ════════════════════════════════════════════════════════════════════════
    // INDEX
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $user     = Auth::user();
        $role     = $this->userRole();
        $isHr     = $this->isHr();
        $isSupervisor = $role === 'branch_supervisor';

        // ── Employee self-view ──────────────────────────────────────────────
        if (! $isHr && ! $isSupervisor) {
            $employee = $this->authEmployee();

            $status = $request->get('status');
            $query  = LeaveRequest::with(['approver', 'rejector'])
                ->where('employee_id', $employee?->id ?? 0)
                ->orderBy('created_at', 'desc');

            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            $requests = $query->get()->map(fn ($r) => $this->formatRequest($r));

            $approver = $employee ? $this->resolveApprover($employee) : null;

            return Inertia::render('Leave/Index', [
                'requests'        => $requests,
                'balance'         => $this->balanceFor($employee),
                'canManage'       => false,
                'canApproveLeave' => false,
                'approver'        => $approver ? [
                    'name' => $approver->name,
                    'role' => $approver->getRoleNames()->first(),
                ] : null,
                'filters'         => ['status' => $status],
                'highlight'       => $request->get('highlight'),
            ]);
        }

        // ── HR / supervisor view ────────────────────────────────────────────
        $status     = $request->get('status');
        $branchId   = $request->get('branch_id');
        $employeeId = $request->get('employee_id');
        $leaveType  = $request->get('leave_type');
        $month      = $request->get('month');
        $year       = $request->get('year', now()->year);
        $search     = $request->get('search');

                $perPage = max(5, min(100, (int) $request->get('per_page', 25)));
$query = LeaveRequest::with(['employee.branch', 'approver', 'rejector'])
            ->orderBy('created_at', 'desc');

        // Branch supervisor: scope to own branch only
        if ($isSupervisor && ! $isHr) {
            $employee = $this->authEmployee();
            if ($employee?->branch_id) {
                $query->whereHas('employee', fn ($q) => $q->where('branch_id', $employee->branch_id));
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

        if ($leaveType) {
            $query->where('leave_type', $leaveType);
        }

        if ($month) {
            $query->whereMonth('date_from', $month)->whereYear('date_from', $year);
        }

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%");
            });
        }

        $requests = $query->paginate($perPage)->through(fn ($r) => $this->formatRequest($r));

        $branches  = Branch::orderBy('name')->get(['id', 'name']);
        $employees = Employee::active()->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'employee_code']);

        // Pending count for badge
        $pendingCount = LeaveRequest::where('status', 'pending')
            ->when($isSupervisor && ! $isHr, function ($q) {
                $emp = $this->authEmployee();
                if ($emp?->branch_id) {
                    $q->whereHas('employee', fn ($q2) => $q2->where('branch_id', $emp->branch_id));
                }
            })
            ->count();

        return Inertia::render('Leave/Index', [
            'requests'        => $requests,
            'pendingCount'    => $pendingCount,
            'canManage'       => true,
            'canApproveLeave' => $this->canApprove(),
            'branches'        => $branches,
            'employees'       => $employees,
            'leaveTypes'      => LeaveRequest::LEAVE_TYPES,
            'filters'         => compact('status', 'branchId', 'employeeId', 'leaveType', 'month', 'year', 'search') + ['per_page' => $perPage],
            'highlight'       => $request->get('highlight'),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // STORE
    // ════════════════════════════════════════════════════════════════════════

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'leave_type'  => 'required|in:' . implode(',', array_keys(LeaveRequest::LEAVE_TYPES)),
            'date_from'   => 'required|date',
            'date_to'     => 'required|date|after_or_equal:date_from',
            'session'     => 'required|in:full_day,first_half,second_half',
            'remarks'     => 'nullable|string|max:1000',
            'attachment'  => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'status'      => 'nullable|in:draft,pending',
        ]);

        $from    = Carbon::parse($data['date_from']);
        $to      = Carbon::parse($data['date_to']);
        $session = $data['session'];

        // Resolve employee
        $employee = ($this->isHr() || $this->userRole() === 'branch_supervisor') && ! empty($data['employee_id'])
            ? Employee::findOrFail($data['employee_id'])
            : $this->authEmployee();

        abort_unless($employee, 403, 'No employee record found for this user.');

        $days = $this->computeBusinessDays($from, $to, $session);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave-attachments', 'private');
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id'    => $employee->id,
            'leave_type'     => $data['leave_type'],
            'date_from'      => $from->toDateString(),
            'date_to'        => $to->toDateString(),
            'days_requested' => $days,
            'session'        => $session,
            'remarks'        => $data['remarks'] ?? null,
            'attachment_path'=> $attachmentPath,
            'status'         => $data['status'] ?? 'pending',
            'created_by'     => Auth::id(),
        ]);

        if ($leaveRequest->status === 'pending') {
            event(new LeaveRequestFiled($leaveRequest));
        }

        return redirect()->route('leave.index')
            ->with('success', 'Leave request submitted.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // APPROVE
    // ════════════════════════════════════════════════════════════════════════

    public function approve(LeaveRequest $leave): RedirectResponse
    {
        abort_unless($this->canApprove(), 403);
        abort_unless($leave->status === 'pending', 422, 'Only pending requests can be approved.');

        $leave->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'updated_by'  => Auth::id(),
        ]);

        event(new LeaveRequestApproved($leave));

        return back()->with('success', 'Leave request approved.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // REJECT
    // ════════════════════════════════════════════════════════════════════════

    public function reject(Request $request, LeaveRequest $leave): RedirectResponse
    {
        abort_unless($this->canApprove(), 403);
        abort_unless($leave->status === 'pending', 422, 'Only pending requests can be rejected.');

        $data = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $leave->update([
            'status'           => 'rejected',
            'rejected_by'      => Auth::id(),
            'rejection_reason' => $data['rejection_reason'],
            'updated_by'       => Auth::id(),
        ]);

        event(new LeaveRequestRejected($leave));

        return back()->with('success', 'Leave request rejected.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // CANCEL
    // ════════════════════════════════════════════════════════════════════════

    public function cancel(LeaveRequest $leave): RedirectResponse
    {
        $employee = $this->authEmployee();

        // Only the filing employee can cancel their own pending request
        abort_unless(
            $leave->employee_id === $employee?->id && $leave->status === 'pending',
            403,
            'You cannot cancel this request.'
        );

        $leave->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
            'updated_by'   => Auth::id(),
        ]);

        return back()->with('success', 'Leave request cancelled.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // DESTROY
    // ════════════════════════════════════════════════════════════════════════

    public function destroy(LeaveRequest $leave): RedirectResponse
    {
        abort_unless($this->isHr(), 403);
        $leave->delete();

        return redirect()->route('leave.index')
            ->with('success', 'Leave request deleted.');
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function formatRequest(LeaveRequest $r): array
    {
        return [
            'id'               => $r->id,
            'leave_type'       => $r->leave_type,
            'leave_type_label' => LeaveRequest::LEAVE_TYPES[$r->leave_type] ?? $r->leave_type,
            'date_from'        => $r->date_from?->toDateString(),
            'date_to'          => $r->date_to?->toDateString(),
            'days_requested'   => $r->days_requested,
            'session'          => $r->session,
            'session_label'    => LeaveRequest::SESSIONS[$r->session] ?? $r->session,
            'remarks'          => $r->remarks,
            'status'           => $r->status,
            'created_at'       => $r->created_at?->toDateString(),
            'approved_by_name' => $r->approver?->name,
            'approved_at'      => $r->approved_at?->toDateString(),
            'rejected_by_name' => $r->rejector?->name,
            'rejection_reason' => $r->rejection_reason,
            'cancelled_at'     => $r->cancelled_at?->toDateString(),
            'employee'         => $r->employee ? [
                'id'            => $r->employee->id,
                'display_name'  => $r->employee->display_name,
                'employee_code' => $r->employee->employee_code,
                'branch_name'   => $r->employee->branch?->name,
            ] : null,
        ];
    }

    private function balanceFor(?Employee $employee): array
    {
        if (! $employee) {
            return ['sil_remaining' => 0, 'sil_total' => 0, 'vl_fund' => 0];
        }

        return [
            'sil_remaining' => $employee->sil_remaining,
            'sil_total'     => $employee->sil_total ?? 0,
            'vl_fund'       => $employee->vl_fund ?? 0,
        ];
    }
}
