<?php

namespace Modules\AccountsPayable\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\AccountsPayable\Http\Requests\StorePayableRequest;
use Modules\AccountsPayable\Models\Payable;
use Modules\Contacts\Models\Contact;

class AccountsPayableController extends Controller
{
    // ─── Roles ─────────────────────────────────────────────────────────────

    // Can create and update payables
    private const PREPARER_ROLES = [
        'accounting_officer',
        'disbursement_officer',
    ];

    // Can check (Admin Auditor step)
    private const CHECKER_ROLES = [
        'admin_auditor',
        'general_manager',
    ];

    // Can give final approval (JRT)
    private const APPROVER_ROLES = [
        'general_manager',
    ];

    // Full view access
    private const VIEW_ROLES = [
        'accounting_officer',
        'disbursement_officer',
        'admin_auditor',
        'general_manager',
        'resa_officer',       // can originate payment requests
    ];

    // ─── Index ──────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $status = $request->get('status');
        $currency = $request->get('currency');
        $month = $request->get('month');

        $query = Payable::with(['contact', 'branch', 'createdBy', 'voucher'])
            ->latest('invoice_date');

        $query->search($search)
            ->forStatus($status)
            ->forCurrency($currency);

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $payables = $query->paginate(25)->withQueryString();

        $summary = Payable::search($search)
            ->forStatus($status)
            ->forCurrency($currency)
            ->selectRaw('
                sum(invoice_amount_php) as total_invoice_php,
                sum(invoice_amount_usd) as total_invoice_usd,
                sum(invoice_amount_jpy) as total_invoice_jpy,
                sum(payment_php)        as total_paid_php,
                sum(payment_usd)        as total_paid_usd,
                sum(payment_jpy)        as total_paid_jpy,
                sum(balance_php)        as total_balance_php,
                sum(balance_usd)        as total_balance_usd,
                sum(balance_jpy)        as total_balance_jpy,
                count(*)                as total_count
            ')->first();

        return Inertia::render('AccountsPayable/Index', [
            'payables' => $payables,
            'summary' => $summary,
            'filters' => compact('search', 'status', 'currency', 'month'),
            'statuses' => Payable::STATUSES,
            'currencies' => Payable::CURRENCIES,
            'approvalStatuses' => Payable::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Create ─────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requirePreparer($request);

        $suppliers = Contact::where('type', 'supplier')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'account_number']);

        return Inertia::render('AccountsPayable/Create', [
            'currencies' => Payable::CURRENCIES,
            'paymentModes' => Payable::PAYMENT_MODES,
            'statuses' => Payable::STATUSES,
            'suppliers' => $suppliers,
        ]);
    }

    // ─── Store ───────────────────────────────────────────────────────────────

    public function store(StorePayableRequest $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id;

        // Compute balances
        $data['balance_php'] = max(0, (float) ($data['invoice_amount_php'] ?? 0) - (float) ($data['payment_php'] ?? 0));
        $data['balance_usd'] = max(0, (float) ($data['invoice_amount_usd'] ?? 0) - (float) ($data['payment_usd'] ?? 0));
        $data['balance_jpy'] = max(0, (float) ($data['invoice_amount_jpy'] ?? 0) - (float) ($data['payment_jpy'] ?? 0));

        // Auto-status
        $allPaid = $data['balance_php'] <= 0 && $data['balance_usd'] <= 0 && $data['balance_jpy'] <= 0;
        if ($allPaid) {
            $data['status'] = 'paid';
        } elseif (! empty($data['due_date']) && now()->greaterThan($data['due_date'])) {
            $data['status'] = 'overdue';
        } else {
            $data['status'] = 'pending';
        }

        // USD invoices must use cash
        if (($data['currency'] ?? 'PHP') === 'USD') {
            $data['mode_of_payment'] = 'cash';
        }

        $payable = Payable::create($data);

        return redirect()
            ->route('ap.show', $payable)
            ->with('flash', ['type' => 'success', 'message' => 'Payable recorded.']);
    }

    // ─── Show ────────────────────────────────────────────────────────────────

    public function show(Request $request, Payable $ap): Response|JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $ap->load(['contact', 'branch', 'createdBy', 'updatedBy', 'checker', 'approver', 'releaser', 'voucher']);

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'payable' => $ap,
            'currencies' => Payable::CURRENCIES,
            'statuses' => Payable::STATUSES,
            'approvalStatuses' => Payable::APPROVAL_STATUSES,
            'paymentModes' => Payable::PAYMENT_MODES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
        }
        return Inertia::render('AccountsPayable/Show', [
            'payable' => $ap,
            'currencies' => Payable::CURRENCIES,
            'statuses' => Payable::STATUSES,
            'approvalStatuses' => Payable::APPROVAL_STATUSES,
            'paymentModes' => Payable::PAYMENT_MODES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Edit ────────────────────────────────────────────────────────────────

    public function edit(Request $request, Payable $ap): Response
    {
        $this->requirePreparer($request);

        if ($ap->isApproved()) {
            return redirect()->route('ap.show', $ap)
                ->with('flash', ['type' => 'warning', 'message' => 'Record is approved and locked.']);
        }

        $suppliers = Contact::where('type', 'supplier')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'account_number']);

        return Inertia::render('AccountsPayable/Edit', [
            'payable' => $ap,
            'currencies' => Payable::CURRENCIES,
            'paymentModes' => Payable::PAYMENT_MODES,
            'statuses' => Payable::STATUSES,
            'suppliers' => $suppliers,
        ]);
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    public function update(StorePayableRequest $request, Payable $ap): RedirectResponse
    {
        $this->requirePreparer($request);

        if ($ap->isApproved()) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Cannot edit an approved record.']);
        }

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        // Recompute balances
        $data['balance_php'] = max(0, (float) ($data['invoice_amount_php'] ?? $ap->invoice_amount_php) - (float) ($data['payment_php'] ?? $ap->payment_php));
        $data['balance_usd'] = max(0, (float) ($data['invoice_amount_usd'] ?? $ap->invoice_amount_usd) - (float) ($data['payment_usd'] ?? $ap->payment_usd));
        $data['balance_jpy'] = max(0, (float) ($data['invoice_amount_jpy'] ?? $ap->invoice_amount_jpy) - (float) ($data['payment_jpy'] ?? $ap->payment_jpy));

        $allPaid = $data['balance_php'] <= 0 && $data['balance_usd'] <= 0 && $data['balance_jpy'] <= 0;
        $due = $data['due_date'] ?? $ap->due_date?->toDateString();

        if ($ap->status !== 'filed') {
            if ($allPaid) {
                $data['status'] = 'paid';
            } elseif ($due && now()->greaterThan($due)) {
                $data['status'] = 'overdue';
            } else {
                $data['status'] = 'pending';
            }
        }

        if (($data['currency'] ?? $ap->currency) === 'USD') {
            $data['mode_of_payment'] = 'cash';
        }

        $ap->update($data);

        return redirect()
            ->route('ap.show', $ap)
            ->with('flash', ['type' => 'success', 'message' => 'Payable updated.']);
    }

    // ─── Destroy ─────────────────────────────────────────────────────────────

    public function destroy(Request $request, Payable $ap): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['general_manager', 'accounting_officer'], true)) {
            abort(403);
        }

        $ap->delete();

        return redirect()
            ->route('ap.index')
            ->with('flash', ['type' => 'success', 'message' => 'Payable removed.']);
    }

    // ─── Approval chain ──────────────────────────────────────────────────────

    public function check(Request $request, Payable $ap): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::CHECKER_ROLES, true)) {
            abort(403, 'Only the Admin Auditor or General Manager can check payables.');
        }

        if ($ap->checked_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already checked.']);
        }

        $request->validate(['audit_remarks' => ['nullable', 'string']]);

        $ap->update([
            'checked_by' => $request->user()->id,
            'checked_at' => now(),
            'approval_status' => 'checked',
            'audit_remarks' => $request->audit_remarks ?? $ap->audit_remarks,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Payable checked.']);
    }

    public function approve(Request $request, Payable $ap): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::APPROVER_ROLES, true)) {
            abort(403, 'Only the General Manager can approve payables.');
        }

        if (! $ap->checked_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Payable must be checked before approval.']);
        }

        if ($ap->approved_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already approved.']);
        }

        $ap->update([
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'approval_status' => 'approved',
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Payable approved. Ready for release.']);
    }

    public function release(Request $request, Payable $ap): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['disbursement_officer', 'accounting_officer', 'general_manager'], true)) {
            abort(403);
        }

        if (! $ap->approved_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Payable must be approved before release.']);
        }

        $request->validate([
            'payment_date' => ['nullable', 'date'],
            'deposit_slip_attached' => ['nullable', 'boolean'],
        ]);

        $updates = [
            'released_by' => $request->user()->id,
            'released_at' => now(),
            'approval_status' => 'released',
            'updated_by' => $request->user()->id,
        ];

        if ($request->payment_date) {
            $updates['payment_date'] = $request->payment_date;
        }

        if ($request->deposit_slip_attached) {
            $updates['deposit_slip_attached'] = true;
            $updates['deposit_slip_attached_at'] = now();
        }

        $ap->update($updates);

        // Mark as filed after release
        $ap->update(['status' => 'filed']);

        return back()->with('flash', ['type' => 'success', 'message' => 'Payable released and filed.']);
    }

    // ─── Record payment ───────────────────────────────────────────────────────

    public function recordPayment(Request $request, Payable $ap): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, array_merge(self::PREPARER_ROLES, ['general_manager']), true)) {
            abort(403);
        }

        $request->validate([
            'payment_php' => ['nullable', 'numeric', 'min:0'],
            'payment_usd' => ['nullable', 'numeric', 'min:0'],
            'payment_jpy' => ['nullable', 'numeric', 'min:0'],
            'payment_date' => ['nullable', 'date'],
            'check_no' => ['nullable', 'string', 'max:100'],
        ]);

        if ($request->payment_php !== null) {
            $ap->payment_php = $request->payment_php;
        }
        if ($request->payment_usd !== null) {
            $ap->payment_usd = $request->payment_usd;
        }
        if ($request->payment_jpy !== null) {
            $ap->payment_jpy = $request->payment_jpy;
        }
        if ($request->payment_date) {
            $ap->payment_date = $request->payment_date;
        }
        if ($request->check_no) {
            $ap->check_no = $request->check_no;
        }

        $ap->recalculate();
        $ap->updated_by = $request->user()->id;
        $ap->save();

        return back()->with('flash', ['type' => 'success', 'message' => 'Payment recorded.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function canPrepare(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::PREPARER_ROLES,
            true
        );
    }

    private function canCheck(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::CHECKER_ROLES,
            true
        );
    }

    private function canApprove(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::APPROVER_ROLES,
            true
        );
    }

    private function requirePreparer(Request $request): void
    {
        if (! $this->canPrepare($request)) {
            abort(403, 'You do not have permission to manage payables.');
        }
    }
}
