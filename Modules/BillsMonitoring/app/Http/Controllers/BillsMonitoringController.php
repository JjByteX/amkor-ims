<?php

namespace Modules\BillsMonitoring\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BillsMonitoring\Models\Bill;

class BillsMonitoringController extends Controller
{
    // ─── Roles ──────────────────────────────────────────────────────────────

    // HR Admin and Disbursement Officer are co-owners per Roles.md
    private const PREPARER_ROLES = ['accounting_assistant'];

    private const CHECKER_ROLES = ['administrative_assistant', 'finance_admin_supervisor'];

    private const APPROVER_ROLES = ['president'];

    private const VIEW_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'accounting_assistant',
        'liaison_officer_finance',
    ];

    // ─── Index ───────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $type = $request->get('bill_type');
        $status = $request->get('status');
        $month = $request->get('month');

                $perPage = max(5, min(100, (int) $request->get('per_page', 25)));
$query = Bill::with(['branch', 'createdBy', 'voucher'])
            ->latest('due_date');

        $query->search($search)->forType($type)->forStatus($status);

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $bills = $query->paginate($perPage)->withQueryString();

        // Base query for summary — same filters as the listing.
        // Count overdue using due_date < today so the figure is always accurate
        // regardless of whether the stored status column has been swept yet.
        $summaryBase = Bill::search($search)->forType($type)->forStatus($status);

        $summary = (object) [
            'total_amount'  => (clone $summaryBase)->sum('amount'),
            'total_count'   => (clone $summaryBase)->count(),
            'pending_count' => (clone $summaryBase)->where('status', '!=', 'paid')
                                    ->where(function ($q) {
                                        $q->whereNull('due_date')
                                          ->orWhere('due_date', '>=', now()->toDateString());
                                    })->count(),
            'overdue_count' => (clone $summaryBase)->effectivelyOverdue()->count(),
            'paid_count'    => (clone $summaryBase)->where('status', 'paid')->count(),
        ];

        return Inertia::render('BillsMonitoring/Index', [
            'bills' => $bills,
            'summary' => $summary,
            'filters' => compact('search', 'type', 'status', 'month') + ['per_page' => $perPage],
            'billTypes' => Bill::BILL_TYPES,
            'statuses' => Bill::STATUSES,
            'approvalStatuses' => Bill::APPROVAL_STATUSES,
            'paymentModes' => Bill::PAYMENT_MODES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Create ──────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('BillsMonitoring/Create', [
            'billTypes' => Bill::BILL_TYPES,
            'paymentModes' => Bill::PAYMENT_MODES,
        ]);
    }

    // ─── Store ───────────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validate([
            'bill_type' => ['required', 'in:'.implode(',', array_keys(Bill::BILL_TYPES))],
            'name' => ['required', 'string', 'max:255'],
            'account_no' => ['nullable', 'string', 'max:100'],
            'provider' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'due_date' => ['required', 'date'],
            'mode_of_payment' => ['nullable', 'in:'.implode(',', array_keys(Bill::PAYMENT_MODES))],
            'remarks' => ['nullable', 'string'],
        ]);

        $data['status'] = now()->greaterThan($data['due_date']) ? 'overdue' : 'pending';
        $data['branch_id'] = $request->user()->branch_id;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $bill = Bill::create($data);

        return redirect()
            ->route('bills.index')
            ->with('flash', ['type' => 'success', 'message' => "Bill \"{$bill->name}\" recorded."]);
    }

    // ─── Show ────────────────────────────────────────────────────────────────

    public function show(Request $request, Bill $bill): Response|\Illuminate\Http\JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $bill->load(['branch', 'createdBy', 'updatedBy', 'checker', 'approver', 'releaser', 'voucher']);

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
                'bill'            => $bill,
                'billTypes'       => Bill::BILL_TYPES,
                'statuses'        => Bill::STATUSES,
                'approvalStatuses' => Bill::APPROVAL_STATUSES,
                'paymentModes'    => Bill::PAYMENT_MODES,
                'canWrite'        => $this->canPrepare($request),
                'canCheck'        => $this->canCheck($request),
                'canApprove'      => $this->canApprove($request),
            ]);
        }

        return Inertia::render('BillsMonitoring/Show', [
            'bill' => $bill,
            'billTypes' => Bill::BILL_TYPES,
            'statuses' => Bill::STATUSES,
            'approvalStatuses' => Bill::APPROVAL_STATUSES,
            'paymentModes' => Bill::PAYMENT_MODES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Edit ────────────────────────────────────────────────────────────────

    public function edit(Request $request, Bill $bill): Response
    {
        $this->requirePreparer($request);

        if ($bill->isApproved()) {
            return redirect()->route('bills.index')
                ->with('flash', ['type' => 'warning', 'message' => 'Record is approved and locked.']);
        }

        return Inertia::render('BillsMonitoring/Edit', [
            'bill' => $bill,
            'billTypes' => Bill::BILL_TYPES,
            'paymentModes' => Bill::PAYMENT_MODES,
        ]);
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    public function update(Request $request, Bill $bill): RedirectResponse
    {
        $this->requirePreparer($request);

        if ($bill->isApproved()) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Cannot edit an approved record.']);
        }

        $data = $request->validate([
            'bill_type' => ['required', 'in:'.implode(',', array_keys(Bill::BILL_TYPES))],
            'name' => ['required', 'string', 'max:255'],
            'account_no' => ['nullable', 'string', 'max:100'],
            'provider' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'due_date' => ['required', 'date'],
            'mode_of_payment' => ['nullable', 'in:'.implode(',', array_keys(Bill::PAYMENT_MODES))],
            'remarks' => ['nullable', 'string'],
        ]);

        if ($bill->status !== 'paid') {
            $data['status'] = now()->greaterThan($data['due_date']) ? 'overdue' : 'pending';
        }

        $data['updated_by'] = $request->user()->id;
        $bill->update($data);

        return redirect()
            ->route('bills.index')
            ->with('flash', ['type' => 'success', 'message' => 'Bill updated.']);
    }

    // ─── Destroy ─────────────────────────────────────────────────────────────

    public function destroy(Request $request, Bill $bill): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        if ($role !== 'president') {
            abort(403);
        }
        if ($bill->isApproved()) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Cannot delete an approved record.']);
        }

        $bill->delete();

        return redirect()->route('bills.index')
            ->with('flash', ['type' => 'success', 'message' => 'Bill removed.']);
    }

    // ─── Approval chain ──────────────────────────────────────────────────────

    public function check(Request $request, Bill $bill): RedirectResponse
    {
        if (! $this->canCheck($request)) {
            abort(403, 'Only Admin Auditor or General Manager can check bills.');
        }
        if ($bill->checked_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already checked.']);
        }

        $request->validate(['audit_remarks' => ['nullable', 'string']]);

        $bill->update([
            'checked_by' => $request->user()->id,
            'checked_at' => now(),
            'approval_status' => 'checked',
            'audit_remarks' => $request->audit_remarks ?? $bill->audit_remarks,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Bill checked.']);
    }

    public function approve(Request $request, Bill $bill): RedirectResponse
    {
        if (! $this->canApprove($request)) {
            abort(403, 'Only the General Manager can approve bills.');
        }
        if (! $bill->checked_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Bill must be checked before approval.']);
        }
        if ($bill->approved_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already approved.']);
        }

        $bill->update([
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'approval_status' => 'approved',
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Bill approved. Ready for payment.']);
    }

    public function release(Request $request, Bill $bill): RedirectResponse
    {
        $this->requirePreparer($request);
        if (! $bill->approved_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Bill must be approved before marking as paid.']);
        }

        $request->validate(['payment_date' => ['nullable', 'date']]);

        $bill->update([
            'released_by' => $request->user()->id,
            'released_at' => now(),
            'approval_status' => 'released',
            'status' => 'paid',
            'payment_date' => $request->payment_date ?? now()->toDateString(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Bill marked as paid.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function canPrepare(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::PREPARER_ROLES, true);
    }

    private function canCheck(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::CHECKER_ROLES, true);
    }

    private function canApprove(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::APPROVER_ROLES, true);
    }

    private function requirePreparer(Request $request): void
    {
        if (! $this->canPrepare($request)) {
            abort(403, 'Only HR & Admin Officer or Disbursement Officer can manage bills.');
        }
    }
}
