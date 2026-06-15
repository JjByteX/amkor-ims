<?php

namespace Modules\Reservation\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\Reservation\Events\ReservationBookingConfirmed;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Reservation\Http\Requests\StoreReservationBookingRequest;
use Modules\Reservation\Models\ReservationBooking;
use Modules\Contacts\Models\Contact;
use Modules\OrmocBranch\Models\OrmocBooking;
use Modules\Visa\Models\VisaApplication;

class ReservationController extends Controller
{
    private const WRITE_ROLES = [
        'general_manager',
        'chief_operations_officer',
        'general_sales_manager',
        'accounting_officer',
        'resa_officer',
        'ormoc_branch_officer',
    ];

    private const VIEW_ROLES = [
        'general_manager',
        'chief_operations_officer',
        'general_sales_manager',
        'accounting_officer',
        'resa_officer',
        'ormoc_branch_officer',
        'admin_auditor',
    ];

    public function index(Request $request): Response
    {
        $this->requireViewer($request);

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $agent = $request->string('agent')->toString();
        $month = $request->string('month')->toString();

        $query = ReservationBooking::with(['branch', 'createdBy'])
            ->latest('date')
            ->search($search)
            ->forStatus($status)
            ->forAgent($agent);

        $this->scopeBranch($request, $query);

        if ($month !== '') {
            [$year, $monthNumber] = array_map('intval', explode('-', $month.'-01'));
            $query->whereYear('date', $year)->whereMonth('date', $monthNumber);
        }

        return Inertia::render('Reservation/Index', [
            'bookings' => $query->paginate(25)->withQueryString(),
            'summary' => (clone $query)->toBase()->reorder()->selectRaw("
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                COALESCE(SUM(selling_price), 0) as gross,
                COALESCE(SUM(income), 0) as income
            ")->first(),
            'filters' => compact('search', 'status', 'agent', 'month'),
            'statuses' => fn () => ReservationBooking::STATUSES,
            'serviceTypes' => fn () => ReservationBooking::SERVICE_TYPES,
            'paymentModes' => fn () => ReservationBooking::PAYMENT_MODES,
            'agentCodes' => fn () => ReservationBooking::AGENT_CODES,
            'canWrite' => $this->canWrite($request),
        ]);
    }

    public function salesReport(Request $request): Response
    {
        if (! ($request->user()?->can('reservation.view_sales_report') || $request->user()?->can('reservation.view_sales_report_own'))) {
            abort(403);
        }

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $agent = $request->string('agent')->toString();
        $serviceType = $request->string('service_type')->toString();
        $month = $request->string('month')->toString();

        $query = ReservationBooking::with(['branch'])
            ->latest('date')
            ->search($search)
            ->forStatus($status)
            ->forAgent($agent);

        if ($serviceType !== '') {
            $query->where('service_type', $serviceType);
        }

        $this->scopeBranch($request, $query);

        if (! $request->user()?->can('reservation.view_sales_report')) {
            $query->where('created_by', $request->user()->id);
        }

        if ($month !== '') {
            [$year, $monthNumber] = array_map('intval', explode('-', $month.'-01'));
            $query->whereYear('date', $year)->whereMonth('date', $monthNumber);
        }

        return Inertia::render('Reservation/SalesReport', [
            'bookings' => $query->paginate(25)->withQueryString(),
            'summary' => (clone $query)->toBase()->reorder()->selectRaw("
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                COALESCE(SUM(selling_price), 0) as gross,
                COALESCE(SUM(income), 0) as income,
                COALESCE(SUM(pax_count), 0) as pax
            ")->first(),
            'filters' => compact('search', 'status', 'agent', 'serviceType', 'month'),
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'agentCodes' => ReservationBooking::AGENT_CODES,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireWriter($request);

        return Inertia::render('Reservation/Form', [
            'booking' => null,
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'agentCodes' => ReservationBooking::AGENT_CODES,
            // URL for the contact typeahead picker — lets the form search contacts
            // by name/TIN without loading the full list upfront.
            'contactsSearchUrl' => route('contacts.search'),
        ]);
    }

    public function store(StoreReservationBookingRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['booking_no'] = ReservationBooking::nextNumber();
        $data['branch_id'] = $request->user()->branch_id;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $booking = new ReservationBooking($data);
        $booking->recalculateIncome();

        if ($booking->status === 'confirmed') {
            $booking->confirmed_at = now();
            $booking->confirmed_by = $request->user()->id;
        }

        $booking->save();

        if ($booking->status === 'confirmed') {
            event(new ReservationBookingConfirmed($booking->id, $booking->booking_no, $booking->client_name, $booking->branch_id, $request->user()->id));
        }

        return redirect()
            ->route('reservation.show', $booking)
            ->with('flash', ['type' => 'success', 'message' => "Reservation {$booking->booking_no} created."]);
    }

    public function show(Request $request, ReservationBooking $booking): Response|JsonResponse
    {
        $this->requireViewer($request);
        $this->authorizeBranch($request, $booking);

        $booking->load(['branch', 'createdBy', 'updatedBy', 'confirmedBy', 'accountingForwarder', 'contact']);

        // ── Related transactions (Gap B) ────────────────────────────────────
        $relatedTransactions = [];
        if ($booking->contact_id) {
            $statusVariants = [
                // Reservation / Ormoc
                'inquiry'    => 'neutral',
                'quoted'     => 'info',
                'confirmed'  => 'success',
                'cancelled'  => 'error',
                // Visa
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

            $ormoc = OrmocBooking::where('contact_id', $booking->contact_id)
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
            'booking' => $booking,
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
            'contactsSearchUrl' => route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ]);
        }
        return Inertia::render('Reservation/Show', [
            'booking' => $booking,
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
            'contactsSearchUrl' => route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ]);
    }

    public function edit(Request $request, ReservationBooking $booking): Response
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        // Eager-load contact so the form can pre-populate the picker with the
        // currently linked contact's name without an extra round-trip.
        $booking->load('contact');

        return Inertia::render('Reservation/Form', [
            'booking' => $booking,
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'transactionTypes' => ReservationBooking::TRANSACTION_TYPES,
            'agentCodes' => ReservationBooking::AGENT_CODES,
            'contactsSearchUrl' => route('contacts.search'),
        ]);
    }

    public function update(StoreReservationBookingRequest $request, ReservationBooking $booking): RedirectResponse
    {
        $this->authorizeBranch($request, $booking);

        $previousStatus = $booking->status;
        $booking->fill($request->validated());
        $booking->updated_by = $request->user()->id;
        $booking->recalculateIncome();

        if ($previousStatus !== 'confirmed' && $booking->status === 'confirmed') {
            $booking->confirmed_at = now();
            $booking->confirmed_by = $request->user()->id;
        }

        $booking->save();

        if ($previousStatus !== 'confirmed' && $booking->status === 'confirmed') {
            event(new ReservationBookingConfirmed($booking->id, $booking->booking_no, $booking->client_name, $booking->branch_id, $request->user()->id));
        }

        return redirect()
            ->route('reservation.show', $booking)
            ->with('flash', ['type' => 'success', 'message' => 'Reservation updated.']);
    }

    public function destroy(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        $booking->delete();

        return redirect()
            ->route('reservation.index')
            ->with('flash', ['type' => 'success', 'message' => 'Reservation archived.']);
    }

    public function updateStatus(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        $data = $request->validate([
            'status' => ['required', 'in:'.implode(',', array_keys(ReservationBooking::STATUSES))],
        ]);

        $previousStatus = $booking->status;
        $updates = [
            'status' => $data['status'],
            'updated_by' => $request->user()->id,
        ];

        if ($previousStatus !== 'confirmed' && $data['status'] === 'confirmed') {
            $updates['confirmed_at'] = now();
            $updates['confirmed_by'] = $request->user()->id;
        }

        $booking->update($updates);

        if ($previousStatus !== 'confirmed' && $data['status'] === 'confirmed') {
            event(new ReservationBookingConfirmed($booking->id, $booking->booking_no, $booking->client_name, $booking->branch_id, $request->user()->id));
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Reservation status updated.']);
    }

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
            'forwarded_to_accounting' => true,
            'forwarded_to_accounting_at' => now(),
            'forwarded_to_accounting_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        event(new ReservationForwardedToAccounting($booking->id, $booking->booking_no, $booking->client_name, $booking->branch_id, $request->user()->id));

        return back()->with('flash', ['type' => 'success', 'message' => 'Reservation forwarded to accounting.']);
    }

    // ─── Link / Unlink Contact ─────────────────────────────────────────────────
    //
    // Lets Accounting attach a Contacts record to a booking from the Show page.
    // Once linked, TIN/address/business_style auto-fill on the BIR transaction
    // generated when the booking is confirmed. Available to any role that can
    // view this record.

    public function linkContact(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireViewer($request);
        $this->authorizeBranch($request, $booking);

        $data = $request->validate([
            'contact_id' => ['required', 'integer', 'exists:contacts,id'],
        ]);

        $booking->update([
            'contact_id' => $data['contact_id'],
            'updated_by' => $request->user()->id,
        ]);

        $contact = Contact::find($data['contact_id']);

        return back()->with('flash', ['type' => 'success', 'message' => 'Linked to '.($contact?->name ?? 'contact').'.']);
    }

    public function unlinkContact(Request $request, ReservationBooking $booking): RedirectResponse
    {
        $this->requireViewer($request);
        $this->authorizeBranch($request, $booking);

        $booking->update([
            'contact_id' => null,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Contact unlinked.']);
    }

    private function canWrite(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::WRITE_ROLES, true);
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

    private function scopeBranch(Request $request, $query): void
    {
        if ($request->user()?->getRoleNames()->first() === 'ormoc_branch_officer') {
            $query->forBranch($request->user()->branch_id);
        }
    }

    private function authorizeBranch(Request $request, ReservationBooking $booking): void
    {
        if (
            $request->user()?->getRoleNames()->first() === 'ormoc_branch_officer'
            && $booking->branch_id !== $request->user()->branch_id
        ) {
            abort(403);
        }
    }
}
