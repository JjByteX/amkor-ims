<?php

namespace Modules\EmployeeRecords\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\EmployeeRecords\Http\Requests\StoreEmployeeRequest;
use Modules\EmployeeRecords\Models\Employee;

class EmployeeRecordsController extends Controller
{
    private const MANAGE_ROLES = ['president', 'finance_admin_supervisor'];

    private const VIEW_ROLES = ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant'];

    private const OWN_RECORD_ROLES = [
        'accounting_assistant',
        'liaison_officer_finance',
        'liaison_officer_visa',
        'visa_documentation_supervisor',
        'visa_documentation_officer',
        'sales_marketing_officer',
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'business_development_manager',
        'general_sales_manager',
        'branch_supervisor',
        'branch_sales_officer',
    ];

    // All 17 system role slugs with human-readable labels — passed to the create form only
    private const ROLES = [
        'president'                     => 'President',
        'chief_operating_officer'       => 'Chief Operating Officer',
        'finance_admin_supervisor'      => 'Finance & Admin Supervisor',
        'administrative_assistant'      => 'Administrative Assistant',
        'accounting_assistant'          => 'Accounting Assistant',
        'liaison_officer_finance'       => 'Liaison Officer (Finance)',
        'general_sales_manager'         => 'General Sales Manager',
        'sales_reservation_officer'     => 'Sales Reservation Officer',
        'sales_ticketing_officer'       => 'Sales Ticketing Officer',
        'group_sales_officer'           => 'Group Sales Officer',
        'business_development_manager'  => 'Business Development Manager',
        'sales_marketing_officer'       => 'Sales Marketing Officer',
        'visa_documentation_supervisor' => 'Visa & Documentation Supervisor',
        'liaison_officer_visa'          => 'Liaison Officer (Visa)',
        'visa_documentation_officer'    => 'Visa & Documentation Officer',
        'branch_supervisor'             => 'Branch Supervisor',
        'branch_sales_officer'          => 'Branch Sales Officer',
    ];

    // ════════════════════════════════════════════════════════════════════════
    // INDEX
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $this->requireViewAccess($request);

        if ($this->canViewOwnOnly($request)) {
            $ownRecord = Employee::where('user_id', $request->user()->id)->first();
            if ($ownRecord) {
                return redirect()->route('employees.show', $ownRecord->id);
            }
            abort(403, 'No employee record found for your account. Contact HR.');
        }

        $search = $request->get('search');
        $status = $request->get('status');
        $dept   = $request->get('department');
        $role   = $request->user()?->getRoleNames()->first();

        $allAccessRoles = ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant'];
        $isAllAccess    = in_array($role, $allAccessRoles, true);

        // Gap 8 — branch scope for all-access roles:
        // 1. URL param branch_id overrides everything (e.g. a direct link or export).
        // 2. Session active_branch_id (set by the sidebar branch switcher) is the
        //    default when no URL param is present.
        // 3. Scoped roles (branch_supervisor, branch_sales_officer, etc.) ignore
        //    both — they are always hard-scoped to their own branch_id.
        $branch = null;
        if ($isAllAccess) {
            $branch = $request->get('branch_id')
                ? (int) $request->get('branch_id')
                : $request->session()->get('active_branch_id');
        }

        $query = Employee::with(['branch', 'createdBy'])
            ->search($search)
            ->forStatus($status)
            ->forDepartment($dept)
            ->latest('date_hired');

        if (! $isAllAccess) {
            $query->forBranch($request->user()->branch_id);
        } elseif ($branch) {
            $query->forBranch($branch);
        }

        $employees = $query->paginate(25)->withQueryString();

        $statsQuery = Employee::query();
        if (! $isAllAccess) {
            $statsQuery->forBranch($request->user()->branch_id);
        } elseif ($branch) {
            $statsQuery->forBranch($branch);
        }

        $stats = (clone $statsQuery)->selectRaw("
            COUNT(*) as total,
            COUNT(CASE WHEN employment_status IN ('probationary', 'regular') THEN 1 END) as active,
            COUNT(CASE WHEN employment_status = 'probationary' THEN 1 END) as probationary,
            COUNT(CASE WHEN employment_status = 'regular' THEN 1 END) as regular,
            COUNT(CASE WHEN employment_status IN ('resigned', 'terminated') THEN 1 END) as inactive,
            COUNT(CASE WHEN employment_status IN ('probationary', 'regular') AND sil_used > sil_total THEN 1 END) as sil_overdue
        ")->first();

        $regularizationDue = Employee::query()
            ->where('employment_status', 'probationary')
            ->whereNotNull('date_hired')
            ->where('date_hired', '<=', now()->subMonths(6))
            ->whereNull('regularization_date')
            ->count();

        return Inertia::render('EmployeeRecords/Index', [
            'employees'         => $employees,
            'stats'             => $stats,
            'regularizationDue' => $regularizationDue,
            'filters'           => compact('search', 'status', 'dept', 'branch'),
            'statuses'          => Employee::EMPLOYMENT_STATUSES,
            'departments'       => Employee::DEPARTMENTS,
            'canManage'         => $this->canManage($request),
            // Gap 8 — passed only for all-access roles; null otherwise.
            // The filter strip uses this to render a Branch <Select> when not null.
            // Active branch is already in the shared prop activeBranch from
            // HandleInertiaRequests — the page reads that for the current value.
            'branches'          => $isAllAccess
                ? \App\Models\Branch::active()->orderBy('name')->get(['id', 'name', 'code'])
                : null,
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHOW
    // ════════════════════════════════════════════════════════════════════════

    public function show(Request $request, Employee $employee): Response|JsonResponse
    {
        $this->requireViewAccess($request);

        if ($this->canViewOwnOnly($request)) {
            $ownRecord = Employee::where('user_id', $request->user()->id)->first();
            if (! $ownRecord || $ownRecord->id !== $employee->id) {
                abort(403, 'You can only view your own employee record.');
            }
        }

        $employee->load(['branch', 'createdBy', 'updatedBy', 'user']);

        $payload = array_merge($employee->toArray(), [
            'full_name'          => $employee->full_name,
            'display_name'       => $employee->display_name,
            'tenure'             => $employee->tenure,
            'sil_remaining'      => $employee->sil_remaining,
            'regularization_due' => $employee->regularization_due,
        ]);

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
                'employee'    => $payload,
                'statuses'    => Employee::EMPLOYMENT_STATUSES,
                'departments' => Employee::DEPARTMENTS,
                'canManage'   => $this->canManage($request),
            ]);
        }

        return Inertia::render('EmployeeRecords/Show', [
            'employee'    => $payload,
            'statuses'    => Employee::EMPLOYMENT_STATUSES,
            'departments' => Employee::DEPARTMENTS,
            'canManage'   => $this->canManage($request),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CREATE / STORE
    // ════════════════════════════════════════════════════════════════════════

    public function create(Request $request): Response
    {
        $this->requireManageAccess($request);

        $creatorRole = $request->user()?->getRoleNames()->first();

        // Only show roles the creator is allowed to assign (hierarchy guard).
        // The full ROLES list is kept for display labels; we filter by the
        // assignable keys returned from StoreEmployeeRequest::assignableRoles().
        $assignableKeys = StoreEmployeeRequest::assignableRoles($creatorRole);
        $roles = array_intersect_key(self::ROLES, array_flip($assignableKeys));

        return Inertia::render('EmployeeRecords/Form', [
            'employee'        => null,
            'statuses'        => Employee::EMPLOYMENT_STATUSES,
            'departments'     => Employee::DEPARTMENTS,
            'genders'         => Employee::GENDERS,
            'civilStatuses'   => Employee::CIVIL_STATUSES,
            'branches'        => Branch::orderBy('name')->get(['id', 'name', 'code']),
            'roles'           => $roles,  // filtered by hierarchy
            'agentCodeLocked' => false,
            'reservedCodes'   => Employee::RESERVED_AGENT_CODES,
        ]);
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        if (empty($data['employee_code'])) {
            $data['employee_code'] = 'AMK-' . str_pad(Employee::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT);
        }

        if (! empty($data['is_agent']) && ! empty($data['agent_code'])) {
            $data['agent_code'] = strtoupper($data['agent_code']);
        } else {
            $data['agent_code'] = null;
        }

        // Extract system access fields — not employee columns
        $loginRole     = $data['login_role'] ?? null;
        $loginPassword = $data['login_password'] ?? null;
        unset($data['login_role'], $data['login_password']);

        $employee = DB::transaction(function () use ($data, $loginRole, $loginPassword) {
            $employee = Employee::create($data);

            // Create the system login if role + password were both supplied.
            // work_email is the login email — it is already on the employee record.
            if ($loginRole && $loginPassword && $employee->work_email) {
                $user = User::create([
                    'name'                 => $employee->display_name,
                    'email'                => $employee->work_email,
                    'password'             => Hash::make($loginPassword),
                    'branch_id'            => $employee->branch_id,
                    'is_active'            => true,
                    'must_change_password' => true,
                    'agent_code'           => ($employee->is_agent && $employee->agent_code)
                                                ? $employee->agent_code
                                                : null,
                ]);

                $user->syncRoles([$loginRole]);
                $employee->update(['user_id' => $user->id]);
            }

            return $employee;
        });

        return redirect()
            ->route('employees.index')
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
            // roles intentionally omitted — System Access card is hidden in edit mode
            'agentCodeLocked' => $employee->is_agent && $employee->hasAgentTransactions(),
            'reservedCodes'   => Employee::RESERVED_AGENT_CODES,
        ]);
    }

    public function update(StoreEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        if (! empty($data['data_privacy_consent']) && ! $employee->data_privacy_consent_date) {
            $data['data_privacy_consent_date'] = now()->toDateString();
        }

        if (! empty($data['is_agent']) && ! empty($data['agent_code'])) {
            if ($employee->is_agent && $employee->hasAgentTransactions()) {
                $data['agent_code'] = $employee->agent_code;
            } else {
                $data['agent_code'] = strtoupper($data['agent_code']);
            }
        } else {
            $data['agent_code'] = null;
        }

        // System access fields are ignored on update
        unset($data['login_role'], $data['login_password']);

        $employee->update($data);

        return redirect()
            ->route('employees.index')
            ->with('flash', ['type' => 'success', 'message' => 'Employee record updated.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DESTROY
    // ════════════════════════════════════════════════════════════════════════

    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        if ($request->user()?->getRoleNames()->first() !== 'president') {
            abort(403, 'Only the President can remove employee records.');
        }

        $employee->delete();

        return redirect()
            ->route('employees.index')
            ->with('flash', ['type' => 'success', 'message' => 'Employee record removed (soft-deleted).']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SIL UPDATE
    // ════════════════════════════════════════════════════════════════════════

    public function updateSil(Request $request, Employee $employee): RedirectResponse
    {
        $this->requireManageAccess($request);

        $validated = $request->validate([
            'sil_total' => ['required', 'integer', 'min:0', 'max:365'],
            'sil_used'  => ['required', 'integer', 'min:0'],
        ]);

        $employee->update(array_merge($validated, ['updated_by' => $request->user()->id]));

        return back()->with('flash', ['type' => 'success', 'message' => 'SIL records updated.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private function requireViewAccess(Request $request): void
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, array_merge(self::VIEW_ROLES, self::OWN_RECORD_ROLES), true)) {
            abort(403, 'You do not have access to employee records.');
        }
    }

    private function canViewOwnOnly(Request $request): bool
    {
        $role = $request->user()?->getRoleNames()->first();
        return in_array($role, self::OWN_RECORD_ROLES, true)
            && ! in_array($role, self::VIEW_ROLES, true);
    }

    private function requireManageAccess(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::MANAGE_ROLES, true)) {
            abort(403, 'Only HR management can manage employee records.');
        }
    }

    private function canManage(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::MANAGE_ROLES, true);
    }
}
