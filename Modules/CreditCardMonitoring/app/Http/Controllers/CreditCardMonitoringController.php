<?php

namespace Modules\CreditCardMonitoring\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\CreditCardMonitoring\Models\CreditCard;
use Modules\CreditCardMonitoring\Models\CreditCardPayment;

class CreditCardMonitoringController extends Controller
{
    // ─── Roles ──────────────────────────────────────────────────────────────

    private const PREPARER_ROLES = ['hr_admin_officer', 'disbursement_officer'];

    private const CHECKER_ROLES = ['admin_auditor', 'general_manager'];

    private const APPROVER_ROLES = ['general_manager'];

    private const VIEW_ROLES = ['hr_admin_officer', 'disbursement_officer', 'admin_auditor', 'general_manager'];

    // ════════════════════════════════════════════════════════════════════════
    // CARDS MASTER LIST
    // ════════════════════════════════════════════════════════════════════════

    public function cardsIndex(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $cards = CreditCard::active()
            ->withCount('payments')
            ->with(['payments' => fn ($q) => $q->latest('due_date')->limit(1)])
            ->get();

        return Inertia::render('CreditCardMonitoring/Cards', [
            'cards' => $cards,
            'canWrite' => $this->canPrepare($request),
        ]);
    }

    public function cardStore(Request $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validate([
            'card_name' => ['required', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'last_four' => ['nullable', 'string', 'size:4', 'regex:/^\d{4}$/'],
            'statement_cut_off' => ['nullable', 'integer', 'min:1', 'max:31'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        CreditCard::create($data);

        return back()->with('flash', ['type' => 'success', 'message' => 'Credit card added.']);
    }

    public function cardUpdate(Request $request, CreditCard $card): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validate([
            'card_name' => ['required', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'last_four' => ['nullable', 'string', 'size:4', 'regex:/^\d{4}$/'],
            'statement_cut_off' => ['nullable', 'integer', 'min:1', 'max:31'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['updated_by'] = $request->user()->id;
        $card->update($data);

        return back()->with('flash', ['type' => 'success', 'message' => 'Card updated.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PAYMENTS
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $cardId = $request->get('card_id');
        $status = $request->get('status');
        $month = $request->get('month');

        $query = CreditCardPayment::with(['creditCard', 'createdBy', 'checker', 'approver'])
            ->latest('due_date');

        $query->forCard($cardId)->forStatus($status);

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $payments = $query->paginate(25)->withQueryString();
        $cards = CreditCard::active()->get(['id', 'card_name', 'bank_name', 'last_four']);

        $summary = CreditCardPayment::forCard($cardId)->forStatus($status)
            ->selectRaw('
                sum(amount) as total_amount,
                count(*) as total_count,
                sum(case when status = \'pending\' then 1 else 0 end) as pending_count,
                sum(case when status = \'overdue\' then 1 else 0 end) as overdue_count
            ')->first();

        return Inertia::render('CreditCardMonitoring/Index', [
            'payments' => $payments,
            'cards' => $cards,
            'summary' => $summary,
            'filters' => compact('cardId', 'status', 'month'),
            'statuses' => CreditCardPayment::STATUSES,
            'approvalStatuses' => CreditCardPayment::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('CreditCardMonitoring/Create', [
            'cards' => CreditCard::active()->get(['id', 'card_name', 'bank_name', 'last_four', 'due_day', 'statement_cut_off']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validate([
            'credit_card_id' => ['required', 'exists:credit_cards,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'statement_date' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        $data['payment_no'] = CreditCardPayment::nextNumber();
        $data['status'] = now()->greaterThan($data['due_date']) ? 'overdue' : 'pending';
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $payment = CreditCardPayment::create($data);

        return redirect()
            ->route('credit-cards.show', $payment)
            ->with('flash', ['type' => 'success', 'message' => "Payment {$payment->payment_no} recorded."]);
    }

    public function show(Request $request, CreditCardPayment $payment): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $payment->load(['creditCard', 'createdBy', 'checker', 'approver', 'releaser', 'voucher']);

        return Inertia::render('CreditCardMonitoring/Show', [
            'payment' => $payment,
            'statuses' => CreditCardPayment::STATUSES,
            'approvalStatuses' => CreditCardPayment::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Approval chain ──────────────────────────────────────────────────────

    public function check(Request $request, CreditCardPayment $payment): RedirectResponse
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

        return back()->with('flash', ['type' => 'success', 'message' => 'Payment checked.']);
    }

    public function approve(Request $request, CreditCardPayment $payment): RedirectResponse
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

        return back()->with('flash', ['type' => 'success', 'message' => 'Payment approved.']);
    }

    public function release(Request $request, CreditCardPayment $payment): RedirectResponse
    {
        $this->requirePreparer($request);
        if (! $payment->approved_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Must be approved before release.']);
        }

        $request->validate(['payment_date' => ['nullable', 'date']]);

        $payment->update([
            'released_by' => $request->user()->id,
            'released_at' => now(),
            'approval_status' => 'released',
            'status' => 'paid',
            'payment_date' => $request->payment_date ?? now()->toDateString(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Payment released. Card marked paid.']);
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
