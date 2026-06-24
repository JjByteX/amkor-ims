<?php

namespace Modules\Reservation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\Reservation\Events\ReservationBookingConfirmed;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Reservation\Http\Requests\StoreReservationBookingRequest;
use Modules\Reservation\Mail\OrmocEscalationMail;
use Modules\Reservation\Models\ReservationBooking;
use Modules\Contacts\Models\Contact;
use Modules\Visa\Models\VisaApplication;

class ReservationController extends Controller
{
    // ─── Role lists ───────────────────────────────────────────────────────────
    // Sourced from the Roles & Permissions Matrix (Module 1 + merged Module 2).

    private const WRITE_ROLES = [
        'president',
        'chief_operating_officer',
        'general_sales_manager',
        'accounting_assistant',
        // QC sales roles — own bookings only (🔒)
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        // Ormoc roles — own bookings or branch (see scopeBranch)
        'branch_supervisor',
        'branch_sales_officer',
    ];

    private const VIEW_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'general_sales_manager',
        'business_development_manager',
        'accounting_assistant',
        // QC sales roles
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        // Ormoc roles
        'branch_supervisor',
        'branch_sales_officer',
    ];

    // Gap 8 — the four roles that can switch their active branch via the
    // sidebar ProfileMenu pill. Mirrors HandleInertiaRequests::share().
    private const ALL_ACCESS_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
    ];

    /**
     * Resolve which branch an all-access user is currently scoped to.
     *
     * Priority: explicit `branch_id` URL param (edge-case override, e.g. a
     * report intentionally combining both branches) → session
     * `active_branch_id` set by the ProfileMenu switcher → null (no filter,
     * for roles not in ALL_ACCESS_ROLES this is never called).
     *
     * Returns null only when the request explicitly asks to see all
     * branches combined (?branch_id=all); otherwise always resolves to a
     * concrete branch id so the switcher actually filters data.
     */
    private function resolveActiveBranchId(Request $request): ?int
    {
        if ($request->filled('branch_id')) {
            $param = $request->input('branch_id');
            return $param === 'all' ? null : (int) $param;
        }

        return $request->session()->get('active_branch_id');
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->requireViewer($request);

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $agent  = $request->string('agent')->toString();
        $type   = $request->string('booking_type')->toString();
        $month  = $request->string('month')->toString();

        $query = ReservationBooking::with(['branch', 'createdBy'])
            ->latest('date')
            ->search($search)
            ->forStatus($status)
            ->forAgent($agent);

        if ($type !== '') {
            $query->where('booking_type', $type);
        }

        $this->scopeBranch($request, $query);

        if ($month !== '') {
            [$year, $monthNumber] = array_map('intval', explode('-', $month.'-01'));
            $query->whereYear('date', $year)->whereMonth('date', $monthNumber);
        }

        $user       = $request->user();
        $role       = $user?->getRoleNames()->first();

        // Gap 8 — for all-access roles, the relevant branch for UI purposes
        // (Ormoc-only columns, agent code list) is the active/switched branch,
        // not the user's own home branch (which is always QC for these roles).
        if (in_array($role, self::ALL_ACCESS_ROLES, true)) {
            $activeBranchId = $this->resolveActiveBranchId($request);
            $branchCode = $activeBranchId
                ? \App\Models\Branch::find($activeBranchId)?->code
                : null; // ?branch_id=all — combined view, no single branch code
        } else {
            $branchCode = $user?->branch?->code;
        }

        return Inertia::render('Reservation/Index', [
            'bookings'     => $query->paginate(25)->withQueryString(),
            'summary'      => (clone $query)->toBase()->reorder()->selectRaw("
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                COALESCE(SUM(selling_price), 0) as gross,
                COALESCE(SUM(net_payable), 0) as net_payable,
                COALESCE(SUM(income), 0) as income,
                COALESCE(SUM(pax_count), 0) as pax
            ")->first(),
            'filters'       => compact('search', 'status', 'agent', 'type', 'month'),
            'statuses'      => fn () => ReservationBooking::STATUSES,
            'serviceTypes'  => fn () => ReservationBooking::SERVICE_TYPES,
            'bookingTypes'  => fn () => ReservationBooking::BOOKING_TYPES,
            'paymentModes'  => fn () => ReservationBooking::PAYMENT_MODES,
            'agentCodes'    => fn () => ReservationBooking::agentCodesForBranch($branchCode),
            'isOrmocBranch' => fn () => $branchCode === 'ORMOC',
            'canWrite'      => $this->canWrite($request),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireWriter($request);

        $branchCode = $request->user()?->branch?->code;

        return Inertia::render('Reservation/Form', [
            'booking'          => null,
            'statuses'         => ReservationBooking::STATUSES,
            'serviceTypes'     => ReservationBooking::SERVICE_TYPES,
            'bookingTypes'     => ReservationBooking::BOOKING_TYPES,
            'paymentModes'     => ReservationBooking::PAYMENT_MODES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'agentCodes'       => ReservationBooking::agentCodesForBranch($branchCode),
            'isOrmocBranch'    => $branchCode === 'ORMOC',
            'contactsSearchUrl'=> route('contacts.search'),
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreReservationBookingRequest $request): RedirectResponse
    {
        $data               = $request->validated();
        $data['booking_no'] = ReservationBooking::nextNumber();

        // Branch assignment on create:
        // - Single-branch staff always book under their own branch.
        // - Multi-branch users (president, COO, finance_admin_supervisor,
        //   administrative_assistant) book under their session's active branch.
        //   The sidebar branch switcher controls which branch is active.
        //   Falls back to user's own branch_id if no session branch is set.
        $allAccessRoles = ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant'];
        $isAllAccess    = in_array($request->user()?->getRoleNames()->first(), $allAccessRoles, true);

        $data['branch_id']  = $isAllAccess
            ? ($request->session()->get('active_branch_id') ?? $request->user()->branch_id)
            : $request->user()->branch_id;

        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $booking = new ReservationBooking($data);
        $booking->recalculateIncome();

        // CC surcharge flag — Ormoc only
        if (($data['mode_of_payment'] ?? '') === 'credit_card' && $request->user()?->branch?->code === 'ORMOC') {
            $booking->cc_surcharge_applied = true;
        }

        // Passport expiry check
        $booking->passport_expiry_flagged = $booking->checkPassportExpiry();

        if ($booking->status === 'confirmed') {
            $booking->confirmed_at = now();
            $booking->confirmed_by = $request->user()->id;
        }

        $booking->save();

        if ($booking->status === 'confirmed') {
            event(new ReservationBookingConfirmed(
                $booking->id,
                $booking->booking_no,
                $booking->client_name,
                $booking->branch_id,
                $request->user()->id,
            ));
        }

        return redirect()
            ->route('reservation.index')
            ->with('flash', ['type' => 'success', 'message' => "Reservation {$booking->booking_no} created."]);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, ReservationBooking $booking): Response|JsonResponse
    {
        $this->requireViewer($request);
        $this->authorizeBranch($request, $booking);

        $booking->load([
            'branch',
            'createdBy',
            'updatedBy',
            'confirmedBy',
            'accountingForwarder',
            'contact',
            'escalatedBy',
            'escalationAcknowledgedBy',
            'linkedResaBooking',
        ]);

        $relatedTransactions = $this->buildRelatedTransactions($booking);

        $shared = [
            'booking'          => $booking,
            'statuses'         => ReservationBooking::STATUSES,
            'serviceTypes'     => ReservationBooking::SERVICE_TYPES,
            'bookingTypes'     => ReservationBooking::BOOKING_TYPES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'paymentModes'     => ReservationBooking::PAYMENT_MODES,
            'canWrite'         => $this->canWrite($request),
            'canAcknowledge'   => $this->canAcknowledge($request),
            'contactsSearchUrl'=> route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ];

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json($shared);
        }

        return Inertia::render('Reservation/Show', $shared);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Request $request, ReservationBooking $booking): Response
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        if ($booking->forwarded_to_accounting) {
            return redirect()
                ->route('reservation.show', $booking)
                ->with('flash', ['type' => 'error', 'message' => 'Booking is locked — forwarded to Accounting.']);
        }

        $booking->load('contact');

        $branchCode = $request->user()?->branch?->code;

        return Inertia::render('Reservation/Form', [
            'booking'          => $booking,
            'statuses'         => ReservationBooking::STATUSES,
            'serviceTypes'     => ReservationBooking::SERVICE_TYPES,
            'bookingTypes'     => ReservationBooking::BOOKING_TYPES,
            'paymentModes'     => ReservationBooking::PAYMENT_MODES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'agentCodes'       => ReservationBooking::agentCodesForBranch($branchCode),
            'isOrmocBranch'    => $branchCode === 'ORMOC',
            'contactsSearchUrl'=> route('contacts.search'),
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(StoreReservationBookingRequest $request, ReservationBooking $booking): RedirectResponse
    {
        $this->authorizeBranch($request, $booking);

        if ($booking->forwarded_to_accounting) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Booking is locked — forwarded to Accounting.']);
        }

        $previousStatus = $booking->status;
        $booking->fill($request->validated());
        $booking->updated_by = $request->user()->id;
        $booking->recalculateIncome();

        // CC surcharge flag — Ormoc only
        if ($request->user()?->branch?->code === 'ORMOC') {
            $booking->cc_surcharge_applied = ($booking->mode_of_payment === 'credit_card');
        }

        // Re-check passport expiry
        $booking->passport_expiry_flagged = $booking->checkPassportExpiry();

        if ($previousStatus !== 'confirmed' && $booking->status === 'confirmed') {
            $booking->confirmed_at = now();
            $booking->confirmed_by = $request->user()->id;
        }

        $booking->save();

        if ($previousStatus !== 'confirmed' && $booking->status === 'confirmed') {
            event(new ReservationBookingConfirmed(
                $booking->id,
                $booking->booking_no,
                $booking->client_name,
                $booking->branch_id,
                $request->user()->id,
            ));
        }

        return redirect()
            ->route('reservation.index')
            ->with('flash', ['type' => 'success', 'message' => 'Reservation updated.']);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        $booking->delete();

        return redirect()
            ->route('reservation.index')
            ->with('flash', ['type' => 'success', 'message' => 'Reservation archived.']);
    }

    // ─── Update status ────────────────────────────────────────────────────────

    public function updateStatus(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        $data = $request->validate([
            'status' => ['required', 'in:'.implode(',', array_keys(ReservationBooking::STATUSES))],
        ]);

        $previousStatus = $booking->status;
        $updates = [
            'status'     => $data['status'],
            'updated_by' => $request->user()->id,
        ];

        if ($previousStatus !== 'confirmed' && $data['status'] === 'confirmed') {
            $updates['confirmed_at'] = now();
            $updates['confirmed_by'] = $request->user()->id;
        }

        $booking->update($updates);

        if ($previousStatus !== 'confirmed' && $data['status'] === 'confirmed') {
            event(new ReservationBookingConfirmed(
                $booking->id,
                $booking->booking_no,
                $booking->client_name,
                $booking->branch_id,
                $request->user()->id,
            ));
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Status updated.']);
    }

    // ─── Update notes (Ormoc) ─────────────────────────────────────────────────

    public function updateNotes(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        $request->validate(['notes' => ['nullable', 'string']]);

        $booking->update([
            'notes'      => $request->notes,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Notes saved.']);
    }

    // ─── Forward to accounting ────────────────────────────────────────────────

    public function forwardToAccounting(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        if ($booking->status !== 'confirmed') {
            return back()->with('flash', ['type' => 'error', 'message' => 'Only confirmed bookings can be forwarded to accounting.']);
        }

        if ($booking->forwarded_to_accounting) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'This booking has already been forwarded.']);
        }

        $booking->update([
            'forwarded_to_accounting'    => true,
            'forwarded_to_accounting_at' => now(),
            'forwarded_to_accounting_by' => $request->user()->id,
            'updated_by'                 => $request->user()->id,
        ]);

        event(new ReservationForwardedToAccounting(
            $booking->id,
            $booking->booking_no,
            $booking->client_name,
            $booking->branch_id,
            $request->user()->id,
        ));

        return back()->with('flash', ['type' => 'success', 'message' => 'Reservation forwarded to accounting.']);
    }

    // ─── Escalate to QC head office (Ormoc only) ──────────────────────────────

    public function escalate(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['branch_supervisor', 'branch_sales_officer', 'president'], true)) {
            abort(403);
        }

        if ($booking->escalated_to_head_office) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Booking already escalated to head office.']);
        }

        // Queue escalation email to Sales & Ticketing Officer(s) at QC head office
        $resaOfficers = User::role('sales_ticketing_officer')
            ->where('is_active', true)
            ->whereHas('branch', fn ($q) => $q->where('code', '!=', 'ORMOC'))
            ->get();

        foreach ($resaOfficers as $officer) {
            if ($officer->email) {
                Mail::to($officer->email)->queue(new OrmocEscalationMail($booking, $request->user()->name));
            }
        }

        $booking->update([
            'escalated_to_head_office' => true,
            'escalated_at'             => now(),
            'escalated_by'             => $request->user()->id,
            'booking_type'             => 'international',
            'updated_by'               => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Escalation queued — RESA head office notified.']);
    }

    // ─── Acknowledge escalation (QC sales_ticketing_officer) ──────────────────

    public function acknowledgeEscalation(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['sales_ticketing_officer', 'president'], true)) {
            abort(403);
        }

        if (! $booking->escalated_to_head_office) {
            return back()->with('flash', ['type' => 'error', 'message' => 'This booking has not been escalated.']);
        }

        $data = $request->validate([
            'linked_resa_booking_id' => ['nullable', 'integer', 'exists:reservation_bookings,id'],
        ]);

        $updates = [
            'escalation_acknowledged_at' => $booking->escalation_acknowledged_at ?? now(),
            'escalation_acknowledged_by' => $booking->escalation_acknowledged_by ?? $request->user()->id,
            'updated_by'                 => $request->user()->id,
        ];

        if (array_key_exists('linked_resa_booking_id', $data)) {
            $updates['linked_resa_booking_id'] = $data['linked_resa_booking_id'];
        }

        $booking->update($updates);

        $message = $data['linked_resa_booking_id']
            ? 'Escalation acknowledged and linked to RESA booking.'
            : 'Escalation acknowledged.';

        return back()->with('flash', ['type' => 'success', 'message' => $message]);
    }

    // ─── Mark PO sent to Mariposa (Ormoc only) ────────────────────────────────

    public function markPoToMariposa(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        if ($booking->po_sent_to_mariposa) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'PO already marked as sent to Mariposa.']);
        }

        $booking->update([
            'po_sent_to_mariposa'    => true,
            'po_sent_to_mariposa_at' => now(),
            'updated_by'             => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'PO marked as sent to Mariposa.']);
    }

    // ─── Link / Unlink contact ────────────────────────────────────────────────

    public function linkContact(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireViewer($request);
        $this->authorizeBranch($request, $booking);

        $data = $request->validate([
            'contact_id' => ['required', 'integer', 'exists:contacts,id'],
        ]);

        $booking->update(['contact_id' => $data['contact_id'], 'updated_by' => $request->user()->id]);

        $contact = Contact::find($data['contact_id']);

        return back()->with('flash', ['type' => 'success', 'message' => 'Linked to '.($contact?->name ?? 'contact').'.']);
    }

    public function unlinkContact(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireViewer($request);
        $this->authorizeBranch($request, $booking);

        $booking->update(['contact_id' => null, 'updated_by' => $request->user()->id]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Contact unlinked.']);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function canWrite(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::WRITE_ROLES, true);
    }

    private function canAcknowledge(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            ['sales_ticketing_officer', 'president'],
            true,
        );
    }

    private function requireWriter(Request $request): void
    {
        if (! $this->canWrite($request)) {
            abort(403);
        }
    }

    private function requireViewer(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first() ?? '', self::VIEW_ROLES, true)) {
            abort(403);
        }
    }

    /**
     * Apply branch/ownership scoping to the query based on the user's role.
     *
     * All-access roles   — filtered to their active (switched) branch via
     *                       session active_branch_id; ?branch_id=all bypasses
     *                       this to see both branches combined (🔁 see Gap 8)
     * branch_supervisor  — all records for their branch (🌿)
     * branch_sales_officer  — own records only (🔒)
     * QC sales officers  — own records only (🔒)
     */
    private function scopeBranch(Request $request, $query): void
    {
        $role = $request->user()?->getRoleNames()->first();

        if (in_array($role, self::ALL_ACCESS_ROLES, true)) {
            $activeBranchId = $this->resolveActiveBranchId($request);

            if ($activeBranchId !== null) {
                $query->forBranch($activeBranchId);
            }

            return;
        }

        if ($role === 'branch_supervisor') {
            $query->forBranch($request->user()->branch_id);
            return;
        }

        if (in_array($role, ['branch_sales_officer', 'sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer'], true)) {
            $query->where('created_by', $request->user()->id);
        }
    }

    /**
     * Gate single-record access by branch/ownership.
     * Mirrors scopeBranch but for individual record access.
     */
    private function authorizeBranch(Request $request, ReservationBooking $booking): void
    {
        $role = $request->user()?->getRoleNames()->first();

        if ($role === 'branch_supervisor' && $booking->branch_id !== $request->user()->branch_id) {
            abort(403);
        }

        if (
            in_array($role, ['branch_sales_officer', 'sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer'], true)
            && $booking->created_by !== $request->user()->id
        ) {
            abort(403);
        }
    }

    /** Build the related transactions panel data for the show page. */
    private function buildRelatedTransactions(ReservationBooking $booking): array
    {
        if (! $booking->contact_id) {
            return [];
        }

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

        $reservations = ReservationBooking::where('contact_id', $booking->contact_id)
            ->where('id', '!=', $booking->id)
            ->orderByDesc('date')
            ->limit(10)
            ->get(['id', 'booking_no', 'status', 'selling_price', 'branch_id'])
            ->map(fn ($r) => [
                'id'             => $r->id,
                'type'           => 'reservation',
                'type_label'     => $r->branch_id === $booking->branch_id ? 'RESA' : 'RESA',
                'label'          => $r->booking_no,
                'status'         => $r->status,
                'status_label'   => ReservationBooking::STATUSES[$r->status] ?? $r->status,
                'status_variant' => $statusVariants[$r->status] ?? 'neutral',
                'selling_price'  => $r->selling_price,
                'href'           => route('reservation.show', $r->id),
            ]);

        $visas = VisaApplication::where('contact_id', $booking->contact_id)
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

        return $reservations->concat($visas)
            ->sortByDesc('id')
            ->values()
            ->all();
    }
}