<?php

namespace Modules\AccountsReceivable\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\AccountsReceivable\Events\CollectibleEndorsedToDisbursement;
use Modules\AccountsReceivable\Events\CollectibleFullyApproved;
use Modules\AccountsReceivable\Events\CollectibleSubmittedForApproval;
use Modules\AccountsReceivable\Http\Requests\StoreCollectibleRequest;
use Modules\AccountsReceivable\Models\Collectible;

class AccountsReceivableController extends Controller
{
    // ─── Roles ────────────────────────────────────────────────────────────────

    // ─── Roles ────────────────────────────────────────────────────────────────
    // Canonical slugs per Amkor_IMS___Roles___Permissions_Matrix_1.md (Module 4)

    // Primary owner — creates and manages all AR transactions
    private const ORIGINATOR_ROLES = [
        'accounting_assistant',
    ];

    // Can annotate / update (audit remarks, approval steps)
    private const ANNOTATOR_ROLES = [
        'finance_admin_supervisor',    // dept head; approves financial actions
        'administrative_assistant',    // audit remarks; receives AR report copy
        'general_sales_manager',       // approves collectibles in AR flow
        'chief_operating_officer',     // approves collectibles in AR flow
    ];

    // Roles that can see all records across all branches
    private const FULL_VIEW_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'general_sales_manager',
        'business_development_manager',
        'accounting_assistant',
    ];

    // Roles with scoped / limited read access (enforced per-query)
    private const SCOPED_VIEW_ROLES = [
        'visa_documentation_supervisor', // own dept collectibles only
        'sales_reservation_officer',     // own bookings' AR status only
        'sales_ticketing_officer',       // own bookings' AR status only
        'group_sales_officer',           // own bookings' AR status only
        'branch_supervisor',             // Ormoc collectibles only (branch-scoped)
    ];

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();

        // Gate — deny roles with no access at all
        $allViewRoles = array_merge(self::FULL_VIEW_ROLES, self::ANNOTATOR_ROLES, self::SCOPED_VIEW_ROLES, self::ORIGINATOR_ROLES);
        if (! in_array($role, $allViewRoles, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $dept = $request->get('department');
        $status = $request->get('status');
        $agent = $request->get('agent');
        $month = $request->get('month');
        $account = $request->get('account'); // Phase 3.5 — corporate account filter

        $query = Collectible::with(['branch', 'createdBy'])
            ->latest('date');

        // Scoped views per Module 4 matrix
        if ($role === 'branch_supervisor') {
            // Ormoc branch collectibles only (🌿 branch-scoped)
            $query->forBranch($user->branch_id);
        } elseif (in_array($role, ['sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer'], true)) {
            // Own bookings' AR status only (🔒)
            $query->where('created_by', $user->id);
        } elseif ($role === 'visa_documentation_supervisor') {
            // Own dept collectibles only (👁 read own dept)
            $query->where('department', 'visa');
        }

        $query->search($search)
            ->forDepartment($dept)
            ->forAgent($agent)
            ->forStatus($status)
            ->forCorporateAccount($account); // Phase 3.5

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $collectibles = $query->paginate(25)->withQueryString();

        // Summary totals for the current filtered set (first 500 rows for performance)
        $summaryQuery = Collectible::search($search)
            ->forDepartment($dept)
            ->forAgent($agent)
            ->forStatus($status);

        // Mirror the same scoping applied to the main query
        if ($role === 'branch_supervisor') {
            $summaryQuery->forBranch($user->branch_id);
        } elseif (in_array($role, ['sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer'], true)) {
            $summaryQuery->where('created_by', $user->id);
        } elseif ($role === 'visa_documentation_supervisor') {
            $summaryQuery->where('department', 'visa');
        }

        $summaryQuery->forCorporateAccount($account); // Phase 3.5

        $summary = $summaryQuery->selectRaw('
            sum(collectible_amount_php) as total_collectible_php,
            sum(collectible_amount_usd) as total_collectible_usd,
            sum(payment_received_php)   as total_received_php,
            sum(payment_received_usd)   as total_received_usd,
            sum(balance_php)            as total_balance_php,
            sum(balance_usd)            as total_balance_usd,
            count(*) as total_count
        ')->first();

        return Inertia::render('AccountsReceivable/Index', [
            'collectibles' => $collectibles,
            'summary' => $summary,
            'filters' => compact('search', 'dept', 'status', 'agent', 'month', 'account'),
            'departments' => Collectible::DEPARTMENTS,
            'statuses' => Collectible::STATUSES,
            'approvalStatuses' => Collectible::APPROVAL_STATUSES,
            'canWrite' => $this->canOriginate($request),
            'canApprove' => $this->canApprove($request),
            'canApproveCoo' => $this->canApproveCoo($request),
            'canApproveGsm' => $this->canApproveGsm($request),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireOriginator($request);

        $role = $request->user()->getRoleNames()->first();

        // Pre-select department based on role
        $defaultDept = match ($role) {
            'sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer' => 'resa',
            'visa_documentation_officer', 'visa_documentation_supervisor' => 'visa',
            'branch_supervisor', 'branch_sales_officer' => 'ormoc',
            default => null,
        };

        return Inertia::render('AccountsReceivable/Create', [
            'departments' => Collectible::DEPARTMENTS,
            'statuses' => Collectible::STATUSES,
            'defaultDept' => $defaultDept,
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreCollectibleRequest $request): RedirectResponse
    {
        $this->requireOriginator($request);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id;

        // Only the four manual flags (ibayad, blocking, query, cancelled) may be
        // set from the form. Auto-statuses (pending/current/overdue/paid) are
        // derived below by recalculate() and must never be taken from input.
        if (! in_array($data['status'] ?? null, Collectible::MANUAL_STATUSES, true)) {
            unset($data['status']);
        }

        // balance_php/balance_usd are NOT fillable — recalculate() computes them
        // and also derives the auto-status (unless a manual flag was set above).
        $collectible = new Collectible($data);
        $collectible->recalculate();
        $collectible->save();

        // Notify COO and GSM that a new collectible is pending their approval
        CollectibleSubmittedForApproval::dispatch($collectible);

        return redirect()
            ->route('ar.index')
            ->with('flash', ['type' => 'success', 'message' => 'Collectible recorded.']);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, Collectible $ar): Response|JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, array_merge(self::ORIGINATOR_ROLES, self::FULL_VIEW_ROLES, self::ANNOTATOR_ROLES, self::SCOPED_VIEW_ROLES), true)) {
            abort(403);
        }

        // Enforce per-record scope for roles with limited read access (mirrors index() scoping)
        $user = $request->user();
        if (in_array($role, ['sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer'], true)
            && $ar->created_by !== $user->id) {
            abort(403);
        }
        if ($role === 'branch_supervisor' && $ar->branch_id !== $user->branch_id) {
            abort(403);
        }
        if ($role === 'visa_documentation_supervisor' && $ar->department !== 'visa') {
            abort(403);
        }

        $ar->load(['branch', 'createdBy', 'updatedBy', 'cooApprover', 'gsmApprover']);

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'collectible' => $ar,
            'departments' => Collectible::DEPARTMENTS,
            'statuses' => Collectible::STATUSES,
            'approvalStatuses' => Collectible::APPROVAL_STATUSES,
            'canWrite' => $this->canOriginate($request),
            'canApprove' => $this->canApprove($request),
            'canApproveCoo' => $this->canApproveCoo($request),
            'canApproveGsm' => $this->canApproveGsm($request),
            'canAudit' => in_array($role, ['administrative_assistant', 'president'], true),
        ]);
        }
        return Inertia::render('AccountsReceivable/Show', [
            'collectible' => $ar,
            'departments' => Collectible::DEPARTMENTS,
            'statuses' => Collectible::STATUSES,
            'approvalStatuses' => Collectible::APPROVAL_STATUSES,
            'canWrite' => $this->canOriginate($request),
            'canApprove' => $this->canApprove($request),
            'canApproveCoo' => $this->canApproveCoo($request),
            'canApproveGsm' => $this->canApproveGsm($request),
            'canAudit' => in_array($role, ['administrative_assistant', 'president'], true),
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Request $request, Collectible $ar): Response
    {
        $this->requireOriginator($request);

        // Lock record if fully approved — only admin auditor / GM can unlock (out of scope Phase 6)
        if ($ar->isFullyApproved()) {
            return redirect()->route('ar.index')
                ->with('flash', ['type' => 'warning', 'message' => 'Record is approved and locked for editing.']);
        }

        return Inertia::render('AccountsReceivable/Edit', [
            'collectible' => $ar,
            'departments' => Collectible::DEPARTMENTS,
            'statuses' => Collectible::STATUSES,
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(StoreCollectibleRequest $request, Collectible $ar): RedirectResponse
    {
        $this->requireOriginator($request);

        if ($ar->isFullyApproved()) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Cannot edit an approved record.']);
        }

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        // Once a Collectible is linked to a source record (Reservation, Visa,
        // or Ormoc booking), customer/account/particulars/travel info is owned
        // by that source and must not be re-typed here. Only terms, due_date,
        // remarks, payment, and reference numbers remain editable.
        if ($ar->source_type && $ar->source_id) {
            unset(
                $data['customer_name'],
                $data['corporate_account'],
                $data['particulars'],
                $data['travel_date'],
                $data['agent_code'],
            );
        }

        // Only the four manual flags (ibayad, blocking, query, cancelled) may be
        // set from the form. Otherwise leave the existing status untouched and
        // let recalculate() derive/preserve it.
        if (! in_array($data['status'] ?? null, Collectible::MANUAL_STATUSES, true)) {
            unset($data['status']);
        }

        // balance_php/balance_usd are NOT fillable — recalculate() computes them
        // and also derives the auto-status (unless a manual flag was set above).
        $ar->fill($data);
        $ar->recalculate();
        $ar->save();

        return redirect()
            ->route('ar.index')
            ->with('flash', ['type' => 'success', 'message' => 'Collectible updated.']);
    }

    // ─── Destroy ─────────────────────────────────────────────────────────────

    public function destroy(Request $request, Collectible $ar): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        // Only president can soft-delete financial records (per matrix: Delete is never granted to operational staff)
        if ($role !== 'president') {
            abort(403);
        }

        $ar->delete();

        return redirect()
            ->route('ar.index')
            ->with('flash', ['type' => 'success', 'message' => 'Collectible removed.']);
    }

    // ─── COO Approval ─────────────────────────────────────────────────────────

    public function approveCoo(Request $request, Collectible $ar): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['chief_operating_officer', 'president'], true)) {
            abort(403, 'Only the COO or President can approve as COO.');
        }

        if ($ar->approved_by_coo_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'COO approval already recorded.']);
        }

        $newApprovalStatus = $ar->approved_by_gsm_at ? 'approved' : 'coo_approved';

        $ar->update([
            'approved_by_coo' => $request->user()->id,
            'approved_by_coo_at' => now(),
            'approval_status' => $newApprovalStatus,
            'updated_by' => $request->user()->id,
        ]);

        if ($newApprovalStatus === 'approved') {
            CollectibleFullyApproved::dispatch($ar->fresh());
        }

        $msg = $newApprovalStatus === 'approved'
            ? 'Fully approved — both COO and GSM have signed off.'
            : 'COO approval recorded. Awaiting GSM approval.';

        return back()->with('flash', ['type' => 'success', 'message' => $msg]);
    }

    // ─── GSM Approval ─────────────────────────────────────────────────────────

    public function approveGsm(Request $request, Collectible $ar): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['general_sales_manager', 'president'], true)) {
            abort(403, 'Only the GSM or President can approve as GSM.');
        }

        if ($ar->approved_by_gsm_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'GSM approval already recorded.']);
        }

        $newApprovalStatus = $ar->approved_by_coo_at ? 'approved' : 'gsm_approved';

        $ar->update([
            'approved_by_gsm' => $request->user()->id,
            'approved_by_gsm_at' => now(),
            'approval_status' => $newApprovalStatus,
            'updated_by' => $request->user()->id,
        ]);

        if ($newApprovalStatus === 'approved') {
            CollectibleFullyApproved::dispatch($ar->fresh());
        }

        $msg = $newApprovalStatus === 'approved'
            ? 'Fully approved — both COO and GSM have signed off.'
            : 'GSM approval recorded. Awaiting COO approval.';

        return back()->with('flash', ['type' => 'success', 'message' => $msg]);
    }

    // ─── Record payment ────────────────────────────────────────────────────────

    public function recordPayment(Request $request, Collectible $ar): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, array_merge(self::ORIGINATOR_ROLES, self::ANNOTATOR_ROLES, ['president']), true)) {
            abort(403);
        }

        $request->validate([
            'payment_received_php' => ['nullable', 'numeric', 'min:0'],
            'payment_received_usd' => ['nullable', 'numeric', 'min:0'],
            'or_number' => ['nullable', 'string', 'max:100'],
            'ar_number' => ['nullable', 'string', 'max:100'],
        ]);

        $ar->payment_received_php = $request->payment_received_php ?? $ar->payment_received_php;
        $ar->payment_received_usd = $request->payment_received_usd ?? $ar->payment_received_usd;

        if ($request->or_number) {
            $ar->or_number = $request->or_number;
        }
        if ($request->ar_number) {
            $ar->ar_number = $request->ar_number;
        }

        $ar->recalculate();
        $ar->updated_by = $request->user()->id;
        $ar->save();

        return back()->with('flash', ['type' => 'success', 'message' => 'Payment recorded and balance updated.']);
    }

    // ─── Post-approval actions ────────────────────────────────────────────────

    public function endorseToDisbursement(Request $request, Collectible $ar): RedirectResponse
    {
        $this->requireFullyApproved($ar);
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['accounting_assistant', 'president'], true)) {
            abort(403);
        }

        if ($ar->endorsed_to_disbursement) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already endorsed to Disbursement.']);
        }

        $ar->update([
            'endorsed_to_disbursement' => true,
            'endorsed_to_disbursement_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        // Phase 2 — auto-create a Voucher in Disbursement
        CollectibleEndorsedToDisbursement::dispatch($ar->fresh());

        return back()->with('flash', ['type' => 'success', 'message' => 'Endorsed to Disbursement.']);
    }

    public function processRefund(Request $request, Collectible $ar): RedirectResponse
    {
        $this->requireFullyApproved($ar);
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['accounting_assistant', 'administrative_assistant', 'president'], true)) {
            abort(403);
        }
        if ($ar->refund_processed) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Refund already processed.']);
        }

        $request->validate(['audit_remarks' => ['nullable', 'string']]);

        $ar->update([
            'refund_processed' => true,
            'refund_processed_at' => now(),
            'audit_remarks' => $request->audit_remarks ?? $ar->audit_remarks,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Refund marked as processed.']);
    }

    public function endorseDocuments(Request $request, Collectible $ar): RedirectResponse
    {
        $this->requireFullyApproved($ar);
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['accounting_assistant', 'president'], true)) {
            abort(403);
        }
        if ($ar->documents_endorsed) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Documents already endorsed.']);
        }

        $ar->update([
            'documents_endorsed' => true,
            'documents_endorsed_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Documents endorsed to Audit.']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function canOriginate(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::ORIGINATOR_ROLES,
            true
        );
    }

    private function canApprove(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            ['chief_operating_officer', 'general_sales_manager', 'president'],
            true
        );
    }

    private function canApproveCoo(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            ['chief_operating_officer', 'president'],
            true
        );
    }

    private function canApproveGsm(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            ['general_sales_manager', 'president'],
            true
        );
    }

    private function requireOriginator(Request $request): void
    {
        if (! $this->canOriginate($request)) {
            abort(403, 'You do not have permission to create or edit collectibles.');
        }
    }

    private function requireFullyApproved(Collectible $ar): void
    {
        if (! $ar->isFullyApproved()) {
            abort(403, 'Post-approval actions require both COO and GSM approval.');
        }
    }
}
