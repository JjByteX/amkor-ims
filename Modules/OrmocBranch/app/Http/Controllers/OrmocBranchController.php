<?php

namespace Modules\OrmocBranch\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\OrmocBranch\Http\Requests\StoreOrmocBookingRequest;
use Modules\OrmocBranch\Events\OrmocBookingForwardedToAccounting;
use Modules\OrmocBranch\Mail\OrmocEscalationMail;
use Modules\OrmocBranch\Models\OrmocBooking;
use Modules\Contacts\Models\Contact;
use Modules\Reservation\Models\ReservationBooking;
use Modules\Visa\Models\VisaApplication;

class OrmocBranchController extends Controller
{
    // ─── Roles with write access ───────────────────────────────────────────────
    // branch_supervisor: full branch access; branch_sales_officer: own records only
    // sales_ticketing_officer: OIC — escalated records only (not full branch access)
    // president, COO, GSM, accounting_assistant: per matrix M2
    private const WRITE_ROLES = [
        'president',
        'chief_operating_officer',
        'general_sales_manager',
        'accounting_assistant',
        'sales_ticketing_officer',
        'branch_supervisor',
        'branch_sales_officer',
    ];

    // Roles that can view Ormoc records
    private const VIEW_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'general_sales_manager',
        'business_development_manager',
        'accounting_assistant',
        'sales_ticketing_officer',
        'branch_supervisor',
        'branch_sales_officer',
    ];

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();
        $search = $request->get('search');
        $agent = $request->get('agent');
        $status = $request->get('status');
        $type = $request->get('booking_type');
        $month = $request->get('month');
        $year = (int) $request->get('year', now()->year);

        $query = OrmocBooking::with(['branch', 'createdBy'])
            ->latest('date');

        // branch_supervisor sees all records in their branch (🌿)
        if ($role === 'branch_supervisor') {
            $query->forBranch($user->branch_id);
        }

        // branch_sales_officer sees only their own records (🔒)
        if ($role === 'branch_sales_officer') {
            $query->where('created_by', $user->id);
        }

        // sales_ticketing_officer (OIC) — escalated records only, NOT full branch access (M2)
        if ($role === 'sales_ticketing_officer') {
            $query->where('escalated_to_head_office', true);
        }

        $query->search($search);

        if ($agent) {
            $query->forAgent($agent);
        }
        if ($status) {
            $query->where('status', $status);
        }
        if ($type) {
            $query->where('booking_type', $type);
        }

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $bookings = $query->paginate(25)->withQueryString();

        return Inertia::render('OrmocBranch/Index', [
            'bookings' => $bookings,
            'filters' => compact('search', 'agent', 'status', 'type', 'month', 'year'),
            'statuses' => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'agentCodes' => OrmocBooking::AGENT_CODES,
            'canWrite' => $this->canWrite($request),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireWriteAccess($request);

        return Inertia::render('OrmocBranch/Create', [
            'statuses' => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'agentCodes' => OrmocBooking::AGENT_CODES,
            'paymentModes' => OrmocBooking::PAYMENT_MODES,
            // URL for the contact typeahead picker — lets the form search contacts
            // by name/TIN without loading the full list upfront.
            'contactsSearchUrl' => route('contacts.search'),
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreOrmocBookingRequest $request): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id;
        $data['status'] = $data['status'] ?? 'inquiry';
        $data['booking_type'] = $data['booking_type'] ?? 'domestic';

        // Auto-compute income
        if (empty($data['income']) && ! empty($data['selling_price']) && ! empty($data['net_payable'])) {
            $data['income'] = $data['selling_price'] - $data['net_payable'];
        }

        // CC surcharge flag
        if (($data['mode_of_payment'] ?? '') === 'credit_card') {
            $data['cc_surcharge_applied'] = true;
        }

        // Passport expiry check
        $booking = new OrmocBooking($data);
        if (isset($data['passport_expiry'], $data['travel_date'])) {
            $data['passport_expiry_flagged'] = $booking->checkPassportExpiry();
        }

        $booking = OrmocBooking::create($data);

        return redirect()
            ->route('ormoc.index')
            ->with('flash', ['type' => 'success', 'message' => 'Booking recorded.']);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, OrmocBooking $ormoc): Response|JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        // branch_supervisor may only see records within their branch (🌿)
        if ($role === 'branch_supervisor' && $ormoc->branch_id !== $request->user()->branch_id) {
            abort(403);
        }

        // branch_sales_officer may only see their own records (🔒)
        if ($role === 'branch_sales_officer' && $ormoc->created_by !== $request->user()->id) {
            abort(403);
        }

        // sales_ticketing_officer (OIC) may only see escalated records (M2)
        if ($role === 'sales_ticketing_officer' && ! $ormoc->escalated_to_head_office) {
            abort(403);
        }

        $ormoc->load(['branch', 'createdBy', 'updatedBy', 'escalatedBy', 'contact', 'escalationAcknowledgedBy', 'linkedResaBooking']);

        // ── Related transactions (Gap B) ────────────────────────────────────
        $relatedTransactions = [];
        if ($ormoc->contact_id) {
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

            $reservations = ReservationBooking::where('contact_id', $ormoc->contact_id)
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

            $visas = VisaApplication::where('contact_id', $ormoc->contact_id)
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

            $ormocOthers = OrmocBooking::where('contact_id', $ormoc->contact_id)
                ->where('id', '!=', $ormoc->id)
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

            $relatedTransactions = $reservations->concat($visas)->concat($ormocOthers)
                ->sortByDesc('id')
                ->values()
                ->all();
        }
        // ────────────────────────────────────────────────────────────────────

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'booking' => $ormoc,
            'statuses' => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'paymentModes' => OrmocBooking::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
            'canAcknowledge' => $this->canAcknowledge($request),
            'contactsSearchUrl' => route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ]);
        }
        return Inertia::render('OrmocBranch/Show', [
            'booking' => $ormoc,
            'statuses' => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'paymentModes' => OrmocBooking::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
            'canAcknowledge' => $this->canAcknowledge($request),
            'contactsSearchUrl' => route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Request $request, OrmocBooking $ormoc): Response
    {
        $this->requireWriteAccess($request);

        if ($ormoc->forwarded_to_accounting) {
            return redirect()
                ->route('ormoc.show', $ormoc)
                ->with('flash', ['type' => 'error', 'message' => 'Booking is locked — forwarded to Accounting. Contact Admin Auditor to unlock.']);
        }

        // Eager-load contact so the form can pre-populate the picker with the
        // currently linked contact's name without an extra round-trip.
        $ormoc->load('contact');

        return Inertia::render('OrmocBranch/Edit', [
            'booking' => $ormoc,
            'statuses' => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'agentCodes' => OrmocBooking::AGENT_CODES,
            'paymentModes' => OrmocBooking::PAYMENT_MODES,
            'contactsSearchUrl' => route('contacts.search'),
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(StoreOrmocBookingRequest $request, OrmocBooking $ormoc): RedirectResponse
    {
        $this->requireWriteAccess($request);

        if ($ormoc->forwarded_to_accounting) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Booking is locked — forwarded to Accounting.']);
        }

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        // Auto-compute income
        if (! isset($data['income']) && isset($data['selling_price'], $data['net_payable'])) {
            $data['income'] = $data['selling_price'] - $data['net_payable'];
        }

        // CC surcharge flag
        if (($data['mode_of_payment'] ?? '') === 'credit_card') {
            $data['cc_surcharge_applied'] = true;
        } else {
            $data['cc_surcharge_applied'] = false;
        }

        // Re-check passport expiry
        $tempBooking = new OrmocBooking(array_merge($ormoc->toArray(), $data));
        $data['passport_expiry_flagged'] = $tempBooking->checkPassportExpiry();

        $ormoc->update($data);

        return redirect()
            ->route('ormoc.index')
            ->with('flash', ['type' => 'success', 'message' => 'Booking updated.']);
    }

    // ─── Destroy (soft delete) ────────────────────────────────────────────────

    public function destroy(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $ormoc->delete();

        return redirect()
            ->route('ormoc.index')
            ->with('flash', ['type' => 'success', 'message' => 'Booking removed.']);
    }

    // ─── Update status inline ─────────────────────────────────────────────────

    public function updateStatus(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $request->validate([
            'status' => ['required', 'in:'.implode(',', array_keys(OrmocBooking::STATUSES))],
        ]);

        $ormoc->update([
            'status' => $request->status,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Status updated to '.OrmocBooking::STATUSES[$request->status].'.']);
    }

    // ─── Update notes ─────────────────────────────────────────────────────────

    public function updateNotes(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $this->requireWriteAccess($request);
        $request->validate(['notes' => ['nullable', 'string']]);

        $ormoc->update([
            'notes' => $request->notes,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Notes saved.']);
    }

    // ─── Escalate to head office (Ms. Jhona Ramos) ────────────────────────────

    public function escalate(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['branch_supervisor', 'branch_sales_officer', 'president'], true)) {
            abort(403);
        }

        if ($ormoc->escalated_to_head_office) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Booking already escalated to head office.']);
        }

        // Queue escalation email to Sales & Ticketing Officer (OIC) at QC head office
        $resaOfficers = User::role('sales_ticketing_officer')
            ->where('is_active', true)
            ->whereHas('branch', function ($q) {
                $q->where('code', '!=', 'ORMOC');
            })
            ->get();

        foreach ($resaOfficers as $officer) {
            if ($officer->email) {
                Mail::to($officer->email)
                    ->queue(new OrmocEscalationMail($ormoc, $request->user()->name));
            }
        }

        $ormoc->update([
            'escalated_to_head_office' => true,
            'escalated_at' => now(),
            'escalated_by' => $request->user()->id,
            'booking_type' => 'international',
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Escalation queued — RESA head office notified.']);
    }

    // ─── Mark PO sent to Mariposa ─────────────────────────────────────────────

    public function markPoToMariposa(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $this->requireWriteAccess($request);

        if ($ormoc->po_sent_to_mariposa) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'PO already marked as sent to Mariposa.']);
        }

        $ormoc->update([
            'po_sent_to_mariposa' => true,
            'po_sent_to_mariposa_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'PO marked as sent to Mariposa.']);
    }

    // ─── Forward to Accounting (locks booking) ────────────────────────────────

    public function forwardToAccounting(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $this->requireWriteAccess($request);

        if ($ormoc->forwarded_to_accounting) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already forwarded to Accounting.']);
        }

        $ormoc->update([
            'forwarded_to_accounting' => true,
            'forwarded_to_accounting_at' => now(),
            'status' => 'confirmed',
            'updated_by' => $request->user()->id,
        ]);

        event(new OrmocBookingForwardedToAccounting(
            bookingId: $ormoc->id,
            clientName: $ormoc->client_name,
            agentCode: $ormoc->agent_code,
            date: $ormoc->date?->toDateString(),
            sellingPrice: $ormoc->selling_price,
            poNumber: $ormoc->po_number,
            soaNumber: $ormoc->soa_number,
            siNumber: $ormoc->si_number,
            arNumber: $ormoc->ar_number,
            branchId: $ormoc->branch_id,
            actorId: $request->user()->id,
        ));

        return back()->with('flash', ['type' => 'success', 'message' => 'Forwarded to Accounting. Booking is now locked.']);
    }

    // ─── Acknowledge Escalation (RESA Officer / GM) ───────────────────────────
    //
    // Called by the QC RESA officer to confirm they have received and accepted
    // the escalation. Optionally links the RESA booking they created so Ormoc
    // can track the outcome without relying on email or chat.

    public function acknowledgeEscalation(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['sales_ticketing_officer', 'president'], true)) {
            abort(403);
        }

        if (! $ormoc->escalated_to_head_office) {
            return back()->with('flash', ['type' => 'error', 'message' => 'This booking has not been escalated.']);
        }

        $data = $request->validate([
            'linked_resa_booking_id' => ['nullable', 'integer', 'exists:reservation_bookings,id'],
        ]);

        $updates = [
            'escalation_acknowledged_at' => $ormoc->escalation_acknowledged_at ?? now(),
            'escalation_acknowledged_by' => $ormoc->escalation_acknowledged_by ?? $request->user()->id,
            'updated_by' => $request->user()->id,
        ];

        // Allow updating the linked RESA booking even after initial acknowledgment
        if (array_key_exists('linked_resa_booking_id', $data)) {
            $updates['linked_resa_booking_id'] = $data['linked_resa_booking_id'];
        }

        $ormoc->update($updates);

        $message = $data['linked_resa_booking_id']
            ? 'Escalation acknowledged and linked to RESA booking.'
            : 'Escalation acknowledged.';

        return back()->with('flash', ['type' => 'success', 'message' => $message]);
    }

    // ─── Link / Unlink Contact ─────────────────────────────────────────────────
    //
    // Lets Accounting attach a Contacts record to a booking from the Show page.
    // Once linked, TIN/address/business_style auto-fill on the BIR transaction
    // generated when the booking is forwarded to Accounting. Available to any
    // role that can view this record (not gated by canWrite/requireWriteAccess,
    // since linking a contact is an Accounting task, not a branch-officer task).

    public function linkContact(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $data = $request->validate([
            'contact_id' => ['required', 'integer', 'exists:contacts,id'],
        ]);

        $ormoc->update([
            'contact_id' => $data['contact_id'],
            'updated_by' => $request->user()->id,
        ]);

        $contact = Contact::find($data['contact_id']);

        return back()->with('flash', ['type' => 'success', 'message' => 'Linked to '.($contact?->name ?? 'contact').'.']);
    }

    public function unlinkContact(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $ormoc->update([
            'contact_id' => null,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Contact unlinked.']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function canAcknowledge(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            ['sales_ticketing_officer', 'president'],
            true
        );
    }

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
            abort(403, 'You do not have permission to modify Ormoc bookings.');
        }
    }
}
