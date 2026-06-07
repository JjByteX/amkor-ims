<?php

namespace Modules\AccountsReceivable\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AccountsReceivable\Http\Requests\StoreCollectibleRequest;
use Modules\AccountsReceivable\Models\Collectible;

class AccountsReceivableController extends Controller
{
    // ─── Roles ────────────────────────────────────────────────────────────────

    // Originating officers — can create and submit
    private const ORIGINATOR_ROLES = [
        'resa_officer',
        'ormoc_branch_officer',
        'visa_documentation_officer',
        'accounting_officer',
    ];

    // Roles that can see everything (all branches)
    private const FULL_VIEW_ROLES = [
        'general_manager',
        'accounting_officer',
        'chief_operations_officer',
        'general_sales_manager',
        'admin_auditor',
        'disbursement_officer',
    ];

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();

        $search = $request->get('search');
        $dept = $request->get('department');
        $status = $request->get('status');
        $agent = $request->get('agent');
        $month = $request->get('month');

        $query = Collectible::with(['branch', 'createdBy'])
            ->latest('date');

        // Branch-scoped roles see only their own branch records
        if (in_array($role, ['resa_officer', 'visa_documentation_officer'], true)) {
            $query->forBranch($user->branch_id);
        } elseif ($role === 'ormoc_branch_officer') {
            $query->forBranch($user->branch_id);
        }

        $query->search($search)
            ->forDepartment($dept)
            ->forAgent($agent)
            ->forStatus($status);

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

        if (in_array($role, ['resa_officer', 'visa_documentation_officer', 'ormoc_branch_officer'], true)) {
            $summaryQuery->forBranch($user->branch_id);
        }

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
            'filters' => compact('search', 'dept', 'status', 'agent', 'month'),
            'departments' => Collectible::DEPARTMENTS,
            'statuses' => Collectible::STATUSES,
            'approvalStatuses' => Collectible::APPROVAL_STATUSES,
            'canWrite' => $this->canOriginate($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireOriginator($request);

        $role = $request->user()->getRoleNames()->first();

        // Pre-select department based on role
        $defaultDept = match ($role) {
            'resa_officer' => 'resa',
            'visa_documentation_officer' => 'visa',
            'ormoc_branch_officer' => 'ormoc',
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

        // Compute balances before saving
        $data['balance_php'] = max(0, (float) ($data['collectible_amount_php'] ?? 0) - (float) ($data['payment_received_php'] ?? 0));
        $data['balance_usd'] = max(0, (float) ($data['collectible_amount_usd'] ?? 0) - (float) ($data['payment_received_usd'] ?? 0));

        // Auto-status
        if ($data['balance_php'] <= 0 && $data['balance_usd'] <= 0) {
            $data['status'] = 'paid';
        } elseif (! empty($data['due_date']) && now()->greaterThan($data['due_date'])) {
            $data['status'] = 'overdue';
        } else {
            $data['status'] = 'current';
        }

        $collectible = Collectible::create($data);

        return redirect()
            ->route('ar.show', $collectible)
            ->with('flash', ['type' => 'success', 'message' => 'Collectible recorded.']);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, Collectible $ar): Response
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, array_merge(self::ORIGINATOR_ROLES, self::FULL_VIEW_ROLES), true)) {
            abort(403);
        }

        $ar->load(['branch', 'createdBy', 'updatedBy', 'cooApprover', 'gsmApprover']);

        return Inertia::render('AccountsReceivable/Show', [
            'collectible' => $ar,
            'departments' => Collectible::DEPARTMENTS,
            'statuses' => Collectible::STATUSES,
            'approvalStatuses' => Collectible::APPROVAL_STATUSES,
            'canWrite' => $this->canOriginate($request),
            'canApprove' => $this->canApprove($request),
            'canAudit' => $role === 'admin_auditor' || $role === 'general_manager',
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Request $request, Collectible $ar): Response
    {
        $this->requireOriginator($request);

        // Lock record if fully approved — only admin auditor / GM can unlock (out of scope Phase 6)
        if ($ar->isFullyApproved()) {
            return redirect()->route('ar.show', $ar)
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

        // Recompute balances
        $data['balance_php'] = max(0, (float) ($data['collectible_amount_php'] ?? $ar->collectible_amount_php) - (float) ($data['payment_received_php'] ?? $ar->payment_received_php));
        $data['balance_usd'] = max(0, (float) ($data['collectible_amount_usd'] ?? $ar->collectible_amount_usd) - (float) ($data['payment_received_usd'] ?? $ar->payment_received_usd));

        $dueDateStr = $data['due_date'] ?? $ar->due_date?->toDateString();
        if ($data['balance_php'] <= 0 && $data['balance_usd'] <= 0) {
            $data['status'] = 'paid';
        } elseif ($dueDateStr && now()->greaterThan($dueDateStr)) {
            $data['status'] = 'overdue';
        } else {
            $data['status'] = 'current';
        }

        $ar->update($data);

        return redirect()
            ->route('ar.show', $ar)
            ->with('flash', ['type' => 'success', 'message' => 'Collectible updated.']);
    }

    // ─── Destroy ─────────────────────────────────────────────────────────────

    public function destroy(Request $request, Collectible $ar): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        // Only GM or accounting officer can soft-delete
        if (! in_array($role, ['general_manager', 'accounting_officer'], true)) {
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

        if (! in_array($role, ['chief_operations_officer', 'general_manager'], true)) {
            abort(403, 'Only the COO or General Manager can approve as COO.');
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

        $msg = $newApprovalStatus === 'approved'
            ? 'Fully approved — both COO and GSM have signed off.'
            : 'COO approval recorded. Awaiting GSM approval.';

        return back()->with('flash', ['type' => 'success', 'message' => $msg]);
    }

    // ─── GSM Approval ─────────────────────────────────────────────────────────

    public function approveGsm(Request $request, Collectible $ar): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['general_sales_manager', 'general_manager'], true)) {
            abort(403, 'Only the GSM or General Manager can approve as GSM.');
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

        $msg = $newApprovalStatus === 'approved'
            ? 'Fully approved — both COO and GSM have signed off.'
            : 'GSM approval recorded. Awaiting COO approval.';

        return back()->with('flash', ['type' => 'success', 'message' => $msg]);
    }

    // ─── Record payment ────────────────────────────────────────────────────────

    public function recordPayment(Request $request, Collectible $ar): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, array_merge(self::ORIGINATOR_ROLES, ['general_manager', 'accounting_officer']), true)) {
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

        if (! in_array($role, ['accounting_officer', 'general_manager'], true)) {
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

        return back()->with('flash', ['type' => 'success', 'message' => 'Endorsed to Disbursement.']);
    }

    public function processRefund(Request $request, Collectible $ar): RedirectResponse
    {
        $this->requireFullyApproved($ar);
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['accounting_officer', 'admin_auditor', 'general_manager'], true)) {
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

        if (! in_array($role, ['accounting_officer', 'general_manager'], true)) {
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
            ['chief_operations_officer', 'general_sales_manager', 'general_manager'],
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
