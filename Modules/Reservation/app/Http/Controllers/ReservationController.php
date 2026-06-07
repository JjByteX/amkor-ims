<?php

namespace Modules\Reservation\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Reservation\Events\ReservationBookingConfirmed;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Reservation\Http\Requests\StoreReservationBookingRequest;
use Modules\Reservation\Models\ReservationBooking;

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

        $summaryQuery = (clone $query)->toBase();

        return Inertia::render('Reservation/Index', [
            'bookings' => $query->paginate(25)->withQueryString(),
            'summary' => [
                'total' => (clone $summaryQuery)->count(),
                'confirmed' => (clone $summaryQuery)->where('status', 'confirmed')->count(),
                'gross' => (float) (clone $summaryQuery)->sum('selling_price'),
                'income' => (float) (clone $summaryQuery)->sum('income'),
            ],
            'filters' => compact('search', 'status', 'agent', 'month'),
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'agentCodes' => ReservationBooking::AGENT_CODES,
            'canWrite' => $this->canWrite($request),
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
            'agentCodes' => ReservationBooking::AGENT_CODES,
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

    public function show(Request $request, ReservationBooking $booking): Response
    {
        $this->requireViewer($request);
        $this->authorizeBranch($request, $booking);

        $booking->load(['branch', 'createdBy', 'updatedBy', 'confirmedBy', 'accountingForwarder']);

        return Inertia::render('Reservation/Show', [
            'booking' => $booking,
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'canWrite' => $this->canWrite($request),
        ]);
    }

    public function edit(Request $request, ReservationBooking $booking): Response
    {
        $this->requireWriter($request);
        $this->authorizeBranch($request, $booking);

        return Inertia::render('Reservation/Form', [
            'booking' => $booking,
            'statuses' => ReservationBooking::STATUSES,
            'serviceTypes' => ReservationBooking::SERVICE_TYPES,
            'paymentModes' => ReservationBooking::PAYMENT_MODES,
            'agentCodes' => ReservationBooking::AGENT_CODES,
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
