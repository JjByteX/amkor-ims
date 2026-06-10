<?php

namespace Modules\IataPayments\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\Contacts\Models\Contact;
use Modules\IataPayments\Models\IataPayment;
use Modules\Notifications\Services\NotificationDispatcher;

class IataPaymentsController extends Controller
{
    // ─── Roles ──────────────────────────────────────────────────────────────

    // Per Notes.md IATA workflow: Dalle (disbursement_officer) prepares, Auditor checks, JRT approves
    private const PREPARER_ROLES = ['disbursement_officer', 'accounting_officer'];

    private const CHECKER_ROLES = ['admin_auditor', 'general_manager'];

    private const APPROVER_ROLES = ['general_manager'];

    private const VIEW_ROLES = ['disbursement_officer', 'accounting_officer', 'admin_auditor', 'general_manager'];

    // ─── Index ───────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $status = $request->get('status');
        $month = $request->get('month');

        $query = IataPayment::with(['contact', 'branch', 'createdBy', 'checker', 'approver', 'voucher'])
            ->latest('due_date');

        $query->search($search)->forStatus($status);

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $payments = $query->paginate(25)->withQueryString();

        $summary = IataPayment::search($search)->forStatus($status)
            ->selectRaw('
                sum(amount) as total_amount,
                count(*) as total_count,
                sum(case when status = \'pending\' then 1 else 0 end) as pending_count,
                sum(case when status = \'overdue\' then 1 else 0 end) as overdue_count,
                sum(case when status = \'paid\' then 1 else 0 end) as paid_count
            ')->first();

        return Inertia::render('IataPayments/Index', [
            'payments' => $payments,
            'summary' => $summary,
            'filters' => compact('search', 'status', 'month'),
            'statuses' => IataPayment::STATUSES,
            'approvalStatuses' => IataPayment::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Create ──────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requirePreparer($request);

        // Suppliers from contacts directory (type: supplier)
        $operators = Contact::where('type', 'supplier')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('IataPayments/Create', [
            'operators' => $operators,
        ]);
    }

    // ─── Store ───────────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validate([
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'operator_name' => ['required', 'string', 'max:255'],
            'billing_reference' => ['nullable', 'string', 'max:100'],
            'billing_date' => ['nullable', 'date'],
            'due_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'remarks' => ['nullable', 'string'],
        ]);

        $data['payment_no'] = IataPayment::nextNumber();
        $data['status'] = now()->greaterThan($data['due_date']) ? 'overdue' : 'pending';
        $data['branch_id'] = $request->user()->branch_id;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $payment = IataPayment::create($data);

        return redirect()
            ->route('iata.show', $payment)
            ->with('flash', ['type' => 'success', 'message' => "IATA payment {$payment->payment_no} recorded."]);
    }

    // ─── Show ────────────────────────────────────────────────────────────────

    public function show(Request $request, IataPayment $payment): Response|JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $payment->load(['contact', 'branch', 'createdBy', 'updatedBy', 'checker', 'approver', 'releaser', 'voucher']);

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'payment' => $payment,
            'statuses' => IataPayment::STATUSES,
            'approvalStatuses' => IataPayment::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
        }
        return Inertia::render('IataPayments/Show', [
            'payment' => $payment,
            'statuses' => IataPayment::STATUSES,
            'approvalStatuses' => IataPayment::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Edit ────────────────────────────────────────────────────────────────

    public function edit(Request $request, IataPayment $payment): Response
    {
        $this->requirePreparer($request);

        if ($payment->isApproved()) {
            return redirect()->route('iata.show', $payment)
                ->with('flash', ['type' => 'warning', 'message' => 'Record is approved and locked.']);
        }

        $operators = Contact::where('type', 'supplier')->where('is_active', true)
            ->orderBy('name')->get(['id', 'name']);

        return Inertia::render('IataPayments/Edit', [
            'payment' => $payment,
            'operators' => $operators,
        ]);
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    public function update(Request $request, IataPayment $payment): RedirectResponse
    {
        $this->requirePreparer($request);

        if ($payment->isApproved()) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Cannot edit an approved record.']);
        }

        $data = $request->validate([
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'operator_name' => ['required', 'string', 'max:255'],
            'billing_reference' => ['nullable', 'string', 'max:100'],
            'billing_date' => ['nullable', 'date'],
            'due_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'remarks' => ['nullable', 'string'],
        ]);

        if ($payment->status !== 'paid') {
            $data['status'] = now()->greaterThan($data['due_date']) ? 'overdue' : 'pending';
        }

        $data['updated_by'] = $request->user()->id;
        $payment->update($data);

        return redirect()
            ->route('iata.show', $payment)
            ->with('flash', ['type' => 'success', 'message' => 'IATA payment updated.']);
    }

    // ─── Destroy ─────────────────────────────────────────────────────────────

    public function destroy(Request $request, IataPayment $payment): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, ['general_manager', 'disbursement_officer'], true)) {
            abort(403);
        }
        if ($payment->isApproved()) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Cannot delete an approved record.']);
        }

        $payment->delete();

        return redirect()->route('iata.index')
            ->with('flash', ['type' => 'success', 'message' => 'IATA payment removed.']);
    }

    // ─── Approval chain ──────────────────────────────────────────────────────

    public function check(Request $request, IataPayment $payment): RedirectResponse
    {
        if (! $this->canCheck($request)) {
            abort(403);
        }
        if ($payment->checked_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already checked.']);
        }

        $request->validate(['audit_remarks' => ['nullable', 'string']]);

        $payment->update([
            'checked_by' => $request->user()->id,
            'checked_at' => now(),
            'approval_status' => 'checked',
            'audit_remarks' => $request->audit_remarks ?? $payment->audit_remarks,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'IATA payment checked.']);
    }

    public function approve(Request $request, IataPayment $payment): RedirectResponse
    {
        if (! $this->canApprove($request)) {
            abort(403);
        }
        if (! $payment->checked_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Must be checked before approval.']);
        }
        if ($payment->approved_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already approved.']);
        }

        $payment->update([
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'approval_status' => 'approved',
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'IATA payment approved. Ready for settlement.']);
    }

    public function release(Request $request, IataPayment $payment): RedirectResponse
    {
        $this->requirePreparer($request);
        if (! $payment->approved_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Must be approved before release.']);
        }

        $request->validate([
            'payment_date' => ['nullable', 'date'],
            'deposit_slip_attached' => ['nullable', 'boolean'],
        ]);

        $updates = [
            'released_by' => $request->user()->id,
            'released_at' => now(),
            'approval_status' => 'released',
            'status' => 'paid',
            'payment_date' => $request->payment_date ?? now()->toDateString(),
            'updated_by' => $request->user()->id,
        ];

        if ($request->deposit_slip_attached) {
            $updates['deposit_slip_attached'] = true;
            $updates['deposit_slip_attached_at'] = now();
        }

        $payment->update($updates);

        return back()->with('flash', ['type' => 'success', 'message' => 'IATA payment released and filed.']);
    }

    public function notify(Request $request, IataPayment $payment): RedirectResponse
    {
        $this->requirePreparer($request);
        if (! $payment->released_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Must be released before notifying operator.']);
        }

        $payment->loadMissing('contact');

        if ($payment->contact?->email) {
            app(NotificationDispatcher::class)->email(
                $payment->contact->email,
                "Payment confirmation for {$payment->payment_no}",
                "Hello {$payment->operator_name},",
                [
                    "This confirms that Amkor Travel & Tours has released payment for {$payment->payment_no}.",
                    'Amount: PHP '.number_format((float) $payment->amount, 2),
                    'Payment date: '.($payment->payment_date?->format('M d, Y') ?? now()->format('M d, Y')),
                    'Thank you.',
                ],
            );
        }

        app(NotificationDispatcher::class)->notifyRoles(
            ['general_manager', 'admin_auditor', 'accounting_officer'],
            'IATA operator notified',
            "{$payment->operator_name} notification recorded for {$payment->payment_no}.",
            "/iata/{$payment->id}",
            'success',
        );

        $payment->update([
            'operator_notified' => true,
            'operator_notified_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Operator notification sent and recorded.']);
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
            abort(403);
        }
    }
}
