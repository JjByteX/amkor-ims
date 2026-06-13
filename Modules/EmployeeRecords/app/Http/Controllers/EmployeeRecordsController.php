<?php

namespace Modules\EmployeeRecords\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\EmployeeRecords\Http\Requests\StoreEmployeeRequest;
use Modules\EmployeeRecords\Models\Employee;

class EmployeeRecordsController extends Controller
{
    // From Roles.md — HR module
    private const MANAGE_ROLES = ['hr_admin_officer', 'general_manager'];

    private const VIEW_ROLES = ['hr_admin_officer', 'general_manager', 'admin_auditor'];

    // ════════════════════════════════════════════════════════════════════════
    // INDEX
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $this->requireViewAccess($request);

        $search = $request->get('search');
        $status = $request->get('status');
        $dept = $request->get('department');
        $branch = $request->get('branch_id');

        $role = $request->user()?->getRoleNames()->first();

        $query = Employee::with(['branch', 'createdBy'])
            ->search($search)
            ->forStatus($status)
            ->forDepartment($dept)
            ->latest('date_hired');

        // Branch scope: only JRT / HR Admin / Auditor see all branches
        if (! in_array($role, ['general_manager', 'admin_auditor'], true)) {
            $query->forBranch($request->user()->branch_id);
        } elseif ($branch) {
            $query->forBranch((int) $branch);
        }

        $employees = $query->paginate(25)->withQueryString();

        // Stats
        $statsQuery = Employee::query();
        if (! in_array($role, ['general_manager', 'admin_auditor'], true)) {
            $statsQuery->forBranch($request->user()->branch_id);
        }

        $stats = (clone $statsQuery)->selectRaw("
            COUNT(*) as total,
            COUNT(CASE WHEN employment_status IN ('probationary', 'regular') THEN 1 END) as active,
            COUNT(CASE WHEN employment_status = 'probationary' THEN 1 END) as probationary,
            COUNT(CASE WHEN employment_status = 'regular' THEN 1 END) as regular,
            COUNT(CASE WHEN employment_status IN ('resigned', 'terminated') THEN 1 END) as inactive,
            COUNT(CASE WHEN employment_status IN ('probationary', 'regular') AND sil_used > sil_total THEN 1 END) as sil_overdue
        ")->first();

        // Flag probationary employees who've been > 6 months (regularization due)
        $regularizationDue = Employee::query()
            ->where('employment_status', 'probationary')
            ->whereNotNull('date_hired')
            ->where('date_hired', '<=', now()->subMonths(6))
            ->whereNull('regularization_date')
            ->count();

        return Inertia::render('EmployeeRecords/Index', [
            'employees' => $employees,
            'stats' => $stats,
            'regularizationDue' => $regularizationDue,
            'filters' => compact('search', 'status', 'dept', 'branch'),
            'statuses' => Employee::EMPLOYMENT_STATUSES,
            'departments' => Employee::DEPARTMENTS,
            'canManage' => $this->canManage($request),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHOW
    // ════════════════════════════════════════════════════════════════════════

    public function show(Request $request, Employee $employee): Response|JsonResponse
    {
        $this->requireViewAccess($request);
        $employee->load(['branch', 'createdBy', 'updatedBy', 'user']);

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'employee' => array_merge($employee->toArray(), [
                'full_name' => $employee->full_name,
                'display_name' => $employee->display_name,
                'tenure' => $employee->tenure,
                'sil_remaining' => $employee->sil_remaining,
                'regularization_due' => $employee->regularization_due,
            ]),
            'statuses' => Employee::EMPLOYMENT_STATUSES,
            'departments' => Employee::DEPARTMENTS,
            'canManage' => $this->canManage($request),
        ]);
        }
        return Inertia::render('EmployeeRecords/Show', [
            'employee' => array_merge($employee->toArray(), [
                'full_name' => $employee->full_name,
                'display_name' => $employee->display_name,
                'tenure' => $employee->tenure,
                'sil_remaining' => $employee->sil_remaining,
                'regularization_due' => $employee->regularization_due,
            ]),
            'statuses' => Employee::EMPLOYMENT_STATUSES,
            'departments' => Employee::DEPARTMENTS,
            'canManage' => $this->canManage($request),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CREATE / STORE
    // ════════════════════════════════════════════════════════════════════════

    public function create(Request $request): Response
    {
        $this->requireManageAccess($request);

        return Inertia::render('EmployeeRecords/Form', [
            'employee'        => null,
            'statuses'        => Employee::EMPLOYMENT_STATUSES,
            'departments'     => Employee::DEPARTMENTS,
            'genders'         => Employee::GENDERS,
            'civilStatuses'   => Employee::CIVIL_STATUSES,
            'branches'        => Branch::orderBy('name')->get(['id', 'name', 'code']),
            'agentCodeLocked' => false,
            'reservedCodes'   => Employee::RESERVED_AGENT_CODES,
        ]);
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        // Auto-generate employee code if blank
        if (empty($data['employee_code'])) {
            $data['employee_code'] = 'AMK-'.str_pad(Employee::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT);
        }

        // Normalise agent_code to uppercase; clear if is_agent was toggled off
        if (! empty($data['is_agent']) && ! empty($data['agent_code'])) {
            $data['agent_code'] = strtoupper($data['agent_code']);
        } else {
            $data['agent_code'] = null;
        }

        $employee = Employee::create($data);

        return redirect()
            ->route('employees.show', $employee)
            ->with('flash', ['type' => 'success', 'message' => "Employee record for {$employee->display_name} created."]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // EDIT / UPDATE
    // ════════════════════════════════════════════════════════════════════════

    public function edit(Request $request, Employee $employee): Response
    {
        $this->requireManageAccess($request);
        $employee->load(['branch']);

        return Inertia::render('EmployeeRecords/Form', [
            'employee' => array_merge($employee->toArray(), [
                'tenure'        => $employee->tenure,
                'sil_remaining' => $employee->sil_remaining,
            ]),
            'statuses'        => Employee::EMPLOYMENT_STATUSES,
            'departments'     => Employee::DEPARTMENTS,
            'genders'         => Employee::GENDERS,
            'civilStatuses'   => Employee::CIVIL_STATUSES,
            'branches'        => Branch::orderBy('name')->get(['id', 'name', 'code']),
            // Agent code is locked once it has live transactions attached
            'agentCodeLocked' => $employee->is_agent && $employee->hasAgentTransactions(),
            'reservedCodes'   => Employee::RESERVED_AGENT_CODES,
        ]);
    }

    public function update(StoreEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        // Auto set data_privacy_consent_date
        if (! empty($data['data_privacy_consent']) && ! $employee->data_privacy_consent_date) {
            $data['data_privacy_consent_date'] = now()->toDateString();
        }

        // Normalise agent_code; protect codes that are locked by live transactions
        if (! empty($data['is_agent']) && ! empty($data['agent_code'])) {
            // If code is locked, preserve the existing code regardless of input
            if ($employee->is_agent && $employee->hasAgentTransactions()) {
                $data['agent_code'] = $employee->agent_code;
            } else {
                $data['agent_code'] = strtoupper($data['agent_code']);
            }
        } else {
            $data['agent_code'] = null;
        }

        $employee->update($data);

        return redirect()
            ->route('employees.show', $employee)
            ->with('flash', ['type' => 'success', 'message' => 'Employee record updated.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DESTROY (soft delete)
    // ════════════════════════════════════════════════════════════════════════

    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        if ($role !== 'general_manager') {
            abort(403, 'Only the General Manager can remove employee records.');
        }

        $employee->delete();

        return redirect()
            ->route('employees.index')
            ->with('flash', ['type' => 'success', 'message' => 'Employee record removed (soft-deleted).']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SIL UPDATE (HR-only shortcut)
    // ════════════════════════════════════════════════════════════════════════

    public function updateSil(Request $request, Employee $employee): RedirectResponse
    {
        $this->requireManageAccess($request);

        $validated = $request->validate([
            'sil_total' => ['required', 'integer', 'min:0', 'max:365'],
            'sil_used' => ['required', 'integer', 'min:0'],
        ]);

        $employee->update(array_merge($validated, ['updated_by' => $request->user()->id]));

        return back()->with('flash', ['type' => 'success', 'message' => 'SIL records updated.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private function requireViewAccess(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::VIEW_ROLES, true)) {
            abort(403, 'You do not have access to employee records.');
        }
    }

    private function requireManageAccess(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::MANAGE_ROLES, true)) {
            abort(403, 'Only the HR & Admin Officer or General Manager can manage employee records.');
        }
    }

    private function canManage(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::MANAGE_ROLES, true);
    }
}
