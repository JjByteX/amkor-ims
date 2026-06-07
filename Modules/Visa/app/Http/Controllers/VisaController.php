<?php

namespace Modules\Visa\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Visa\Http\Requests\StoreVisaApplicationRequest;
use Modules\Visa\Mail\VisaPaymentRequestMail;
use Modules\Visa\Models\VisaApplication;

class VisaController extends Controller
{
    // ─── Roles with full write access ─────────────────────────────────────────
    private const WRITE_ROLES = [
        'general_manager',
        'visa_documentation_officer',
    ];

    // Roles that can view
    private const VIEW_ROLES = [
        'general_manager',
        'visa_documentation_officer',
        'disbursement_officer',
        'admin_auditor',
        'accounting_officer',
    ];

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();
        $search = $request->get('search');
        $agent = $request->get('agent');
        $status = $request->get('status');
        $month = $request->get('month');   // YYYY-MM
        $year = (int) $request->get('year', now()->year);

        $query = VisaApplication::with(['branch', 'createdBy'])
            ->latest('date');

        // Visa officers see only their branch
        if ($role === 'visa_documentation_officer') {
            $query->forBranch($user->branch_id);
        }

        $query->search($search);

        if ($agent) {
            $query->forAgent($agent);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $applications = $query->paginate(25)->withQueryString();

        return Inertia::render('Visa/Index', [
            'applications' => $applications,
            'filters' => compact('search', 'agent', 'status', 'month', 'year'),
            'statuses' => VisaApplication::STATUSES,
            'agentCodes' => VisaApplication::AGENT_CODES,
            'canWrite' => $this->canWrite($request),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireWriteAccess($request);

        return Inertia::render('Visa/Create', [
            'visaTypes' => VisaApplication::VISA_TYPES,
            'agentCodes' => VisaApplication::AGENT_CODES,
            'statuses' => VisaApplication::STATUSES,
            'paymentModes' => VisaApplication::PAYMENT_MODES,
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreVisaApplicationRequest $request): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id;
        $data['status'] = $data['status'] ?? 'pending';

        // Auto-compute income if not supplied
        if (empty($data['income']) && ! empty($data['selling_price']) && ! empty($data['net_payable'])) {
            $data['income'] = $data['selling_price'] - $data['net_payable'];
        }

        $application = VisaApplication::create($data);

        return redirect()
            ->route('visa.show', $application)
            ->with('flash', ['type' => 'success', 'message' => 'Application recorded.']);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, VisaApplication $visa): Response
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $visa->load(['branch', 'createdBy', 'updatedBy', 'orEndorsedBy']);

        return Inertia::render('Visa/Show', [
            'application' => $visa,
            'statuses' => VisaApplication::STATUSES,
            'paymentModes' => VisaApplication::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
            'canEndorse' => $role === 'visa_documentation_officer' && $visa->or_number && ! $visa->isEndorsed(),
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Request $request, VisaApplication $visa): Response
    {
        $this->requireWriteAccess($request);

        return Inertia::render('Visa/Edit', [
            'application' => $visa,
            'visaTypes' => VisaApplication::VISA_TYPES,
            'agentCodes' => VisaApplication::AGENT_CODES,
            'statuses' => VisaApplication::STATUSES,
            'paymentModes' => VisaApplication::PAYMENT_MODES,
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(StoreVisaApplicationRequest $request, VisaApplication $visa): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        // Auto-compute income if SP and NP changed but income not supplied
        if (! isset($data['income']) && isset($data['selling_price'], $data['net_payable'])) {
            $data['income'] = $data['selling_price'] - $data['net_payable'];
        }

        $visa->update($data);

        return redirect()
            ->route('visa.show', $visa)
            ->with('flash', ['type' => 'success', 'message' => 'Application updated.']);
    }

    // ─── Destroy (soft delete) ────────────────────────────────────────────────

    public function destroy(Request $request, VisaApplication $visa): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $visa->delete();

        return redirect()
            ->route('visa.index')
            ->with('flash', ['type' => 'success', 'message' => 'Application removed.']);
    }

    // ─── Update status inline ─────────────────────────────────────────────────

    public function updateStatus(Request $request, VisaApplication $visa): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $request->validate([
            'status' => ['required', 'in:'.implode(',', array_keys(VisaApplication::STATUSES))],
        ]);

        $visa->update([
            'status' => $request->status,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Status updated to '.VisaApplication::STATUSES[$request->status].'.']);
    }

    // ─── Update notes ─────────────────────────────────────────────────────────

    public function updateNotes(Request $request, VisaApplication $visa): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $request->validate(['notes' => ['nullable', 'string']]);

        $visa->update([
            'notes' => $request->notes,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Notes saved.']);
    }

    // ─── Trigger payment request ───────────────────────────────────────────────
    // Visa Officer manually sends a payment request to the Disbursement Officer.
    // Queued email via Gmail SMTP. Phase 12 adds the automated scheduler
    // that fires this automatically 1 day before payment_due_date.

    public function sendPaymentRequest(Request $request, VisaApplication $visa): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if ($role !== 'visa_documentation_officer' && $role !== 'general_manager') {
            abort(403);
        }

        if ($visa->payment_request_sent) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Payment request already sent.']);
        }

        if (! $visa->payment_due_date) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Set a payment due date before sending the request.']);
        }

        // Find all active Disbursement Officers
        $disbursementOfficers = User::role('disbursement_officer')->where('is_active', true)->get();

        foreach ($disbursementOfficers as $officer) {
            if ($officer->email) {
                Mail::to($officer->email)
                    ->queue(new VisaPaymentRequestMail($visa, $request->user()->name));
            }
        }

        $visa->update([
            'payment_request_sent' => true,
            'payment_request_sent_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Payment request queued for Disbursement Officer.']);
    }

    // ─── Record OR number ─────────────────────────────────────────────────────

    public function recordOr(Request $request, VisaApplication $visa): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $request->validate([
            'or_number' => ['required', 'string', 'max:100'],
        ]);

        $visa->update([
            'or_number' => $request->or_number,
            'or_received_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'OR number recorded.']);
    }

    // ─── Endorse OR to Accounting Disbursement ────────────────────────────────

    public function endorseOr(Request $request, VisaApplication $visa): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if ($role !== 'visa_documentation_officer' && $role !== 'general_manager') {
            abort(403);
        }

        if (! $visa->or_number) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Record the OR number before endorsing.']);
        }

        if ($visa->isEndorsed()) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'OR already endorsed.']);
        }

        $visa->update([
            'or_endorsed_at' => now(),
            'or_endorsed_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'OR endorsed to Accounting Disbursement.']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function canWrite(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::WRITE_ROLES,
            true
        );
    }

    private function requireWriteAccess(Request $request): void
    {
        if (! $this->canWrite($request)) {
            abort(403, 'You do not have permission to modify visa applications.');
        }
    }
}
