<?php

namespace Modules\Visa\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\Visa\Events\VisaOrReceived;
use Modules\Visa\Events\VisaPaymentRequested;
use Modules\Visa\Http\Requests\StoreVisaApplicationRequest;
use Modules\Visa\Mail\VisaPaymentRequestMail;
use Modules\Visa\Models\VisaApplication;
use Illuminate\Support\Facades\DB;
use Modules\Contacts\Models\Contact;
use Modules\Visa\Models\VisaTarget;
use Modules\Reservation\Models\ReservationBooking;
use Modules\OrmocBranch\Models\OrmocBooking;

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
            // URL for the contact typeahead picker — lets the form search contacts
            // by name/TIN without loading the full list upfront.
            'contactsSearchUrl' => route('contacts.search'),
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreVisaApplicationRequest $request): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $data = $request->validated();;
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

    public function show(Request $request, VisaApplication $visa): Response|JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $visa->load(['branch', 'createdBy', 'updatedBy', 'orEndorsedBy', 'contact']);

        // ── Related transactions (Gap B) ────────────────────────────────────
        $relatedTransactions = [];
        if ($visa->contact_id) {
            $statusVariants = [
                'inquiry'    => 'neutral',
                'quoted'     => 'info',
                'confirmed'  => 'success',
                'cancelled'  => 'error',
                'pending'    => 'warning',
                'on_process' => 'info',
                'completed'  => 'success',
                'approved'   => 'success',
                'denied'     => 'error',
                'forfeited'  => 'error',
                'refunded'   => 'neutral',
            ];

            $reservations = ReservationBooking::where('contact_id', $visa->contact_id)
                ->orderByDesc('date')
                ->limit(10)
                ->get(['id', 'booking_no', 'status', 'selling_price'])
                ->map(fn ($r) => [
                    'id'             => $r->id,
                    'type'           => 'reservation',
                    'type_label'     => 'RESA',
                    'label'          => $r->booking_no,
                    'status'         => $r->status,
                    'status_label'   => ReservationBooking::STATUSES[$r->status] ?? $r->status,
                    'status_variant' => $statusVariants[$r->status] ?? 'neutral',
                    'selling_price'  => $r->selling_price,
                    'href'           => route('reservation.show', $r->id),
                ]);

            $visas = VisaApplication::where('contact_id', $visa->contact_id)
                ->where('id', '!=', $visa->id)
                ->orderByDesc('date')
                ->limit(10)
                ->get(['id', 'customer_name', 'status', 'selling_price'])
                ->map(fn ($v) => [
                    'id'             => $v->id,
                    'type'           => 'visa',
                    'type_label'     => 'VISA',
                    'label'          => $v->customer_name,
                    'status'         => $v->status,
                    'status_label'   => VisaApplication::STATUSES[$v->status] ?? $v->status,
                    'status_variant' => $statusVariants[$v->status] ?? 'neutral',
                    'selling_price'  => $v->selling_price,
                    'href'           => route('visa.show', $v->id),
                ]);

            $ormoc = OrmocBooking::where('contact_id', $visa->contact_id)
                ->orderByDesc('date')
                ->limit(10)
                ->get(['id', 'client_name', 'status', 'selling_price'])
                ->map(fn ($o) => [
                    'id'             => $o->id,
                    'type'           => 'ormoc',
                    'type_label'     => 'ORMOC',
                    'label'          => $o->client_name,
                    'status'         => $o->status,
                    'status_label'   => OrmocBooking::STATUSES[$o->status] ?? $o->status,
                    'status_variant' => $statusVariants[$o->status] ?? 'neutral',
                    'selling_price'  => $o->selling_price,
                    'href'           => route('ormoc.show', $o->id),
                ]);

            $relatedTransactions = $reservations->concat($visas)->concat($ormoc)
                ->sortByDesc('id')
                ->values()
                ->all();
        }
        // ────────────────────────────────────────────────────────────────────

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'application' => $visa,
            'statuses' => VisaApplication::STATUSES,
            'paymentModes' => VisaApplication::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
            'canEndorse' => $role === 'visa_documentation_officer' && $visa->or_number && ! $visa->isEndorsed(),
            'contactsSearchUrl' => route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ]);
        }
        return Inertia::render('Visa/Show', [
            'application' => $visa,
            'statuses' => VisaApplication::STATUSES,
            'paymentModes' => VisaApplication::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
            'canEndorse' => $role === 'visa_documentation_officer' && $visa->or_number && ! $visa->isEndorsed(),
            'contactsSearchUrl' => route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Request $request, VisaApplication $visa): Response
    {
        $this->requireWriteAccess($request);

        // Eager-load contact so the form can pre-populate the picker with the
        // currently linked contact's name without an extra round-trip.
        $visa->load('contact');

        return Inertia::render('Visa/Edit', [
            'application' => $visa,
            'visaTypes' => VisaApplication::VISA_TYPES,
            'agentCodes' => VisaApplication::AGENT_CODES,
            'statuses' => VisaApplication::STATUSES,
            'paymentModes' => VisaApplication::PAYMENT_MODES,
            'contactsSearchUrl' => route('contacts.search'),
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

        // Phase 3 — fire event so AP can auto-create the Payable
        VisaPaymentRequested::dispatch($visa);

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

        // Phase 7 — fire event so BirCompliance can auto-create the SI transaction
        VisaOrReceived::dispatch(
            $visa->id,
            $request->or_number,
            $visa->branch_id,
            $request->user()->id,
        );

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

    // ─── Sales Report ─────────────────────────────────────────────────────────
    // Gap #8: filterable monthly income view per agent and visa type.

    public function salesReport(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $year  = (int) $request->get('year',  now()->year);
        $month = (int) $request->get('month', now()->month);
        $agent = $request->get('agent');

        $baseQuery = fn () => VisaApplication::query()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereIn('status', ['approved', 'completed'])
            ->when($role === 'visa_documentation_officer',
                fn ($q) => $q->where('branch_id', $request->user()->branch_id))
            ->when($agent, fn ($q) => $q->where('agent_code', $agent));

        // Rows: one per agent × visa_type
        $rows = ($baseQuery)()
            ->select(
                'agent_code', 'visa_type',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(selling_price) as total_sp'),
                DB::raw('SUM(net_payable)   as total_np'),
                DB::raw('SUM(income)        as total_income'),
            )
            ->groupBy('agent_code', 'visa_type')
            ->orderBy('agent_code')
            ->orderByDesc('total_income')
            ->get();

        // Per-agent totals
        $agentTotals = $rows->groupBy('agent_code')->map(fn ($g) => [
            'agent_code'   => $g->first()->agent_code,
            'count'        => $g->sum('count'),
            'total_sp'     => round((float) $g->sum('total_sp'),     2),
            'total_np'     => round((float) $g->sum('total_np'),     2),
            'total_income' => round((float) $g->sum('total_income'), 2),
        ])->values();

        // Grand totals
        $grandTotals = [
            'count'        => $rows->sum('count'),
            'total_sp'     => round((float) $rows->sum('total_sp'),     2),
            'total_np'     => round((float) $rows->sum('total_np'),     2),
            'total_income' => round((float) $rows->sum('total_income'), 2),
        ];

        // Income by visa type (for bar chart)
        $byType = $rows->groupBy('visa_type')->map(fn ($g) => [
            'visa_type'    => $g->first()->visa_type,
            'count'        => $g->sum('count'),
            'total_income' => round((float) $g->sum('total_income'), 2),
        ])->sortByDesc('total_income')->values();

        // 12-month income trend for selected year
        $monthlyTrend = collect(range(1, 12))->map(function ($m) use ($year, $role, $request, $agent) {
            $q = VisaApplication::query()
                ->whereYear('date', $year)
                ->whereMonth('date', $m)
                ->whereIn('status', ['approved', 'completed'])
                ->when($role === 'visa_documentation_officer',
                    fn ($q2) => $q2->where('branch_id', $request->user()->branch_id))
                ->when($agent, fn ($q2) => $q2->where('agent_code', $agent));

            return [
                'month'  => \Carbon\Carbon::create($year, $m)->format('M'),
                'income' => round((float) $q->sum('income'), 2),
                'count'  => $q->count(),
            ];
        })->values();

        // Monthly target (from visa_targets)
        $target = (float) VisaTarget::query()
            ->where('year', $year)
            ->where('month', $month)
            ->when($agent, fn ($q) => $q->where('agent_code', $agent))
            ->sum('target_amount');

        return Inertia::render('Visa/SalesReport', [
            'rows'         => $rows->values(),
            'agentTotals'  => $agentTotals,
            'grandTotals'  => $grandTotals,
            'byType'       => $byType,
            'monthlyTrend' => $monthlyTrend,
            'filters'      => compact('year', 'month', 'agent'),
            'agentCodes'   => VisaApplication::AGENT_CODES,
            'target'       => $target,
        ]);
    }

    // ─── Link / Unlink Contact ─────────────────────────────────────────────────
    //
    // Lets Accounting attach a Contacts record to a visa application from the
    // Show page. Once linked, TIN/address/business_style auto-fill on the BIR
    // transaction generated when the OR number is recorded. Available to any
    // role that can view this record.

    public function linkContact(Request $request, VisaApplication $visa): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $data = $request->validate([
            'contact_id' => ['required', 'integer', 'exists:contacts,id'],
        ]);

        $visa->update([
            'contact_id' => $data['contact_id'],
            'updated_by' => $request->user()->id,
        ]);

        $contact = Contact::find($data['contact_id']);

        return back()->with('flash', ['type' => 'success', 'message' => 'Linked to '.($contact?->name ?? 'contact').'.']);
    }

    public function unlinkContact(Request $request, VisaApplication $visa): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $visa->update([
            'contact_id' => null,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Contact unlinked.']);
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
