<?php

namespace Modules\OrmocBranch\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Modules\OrmocBranch\Http\Requests\StoreOrmocBookingRequest;
use Modules\OrmocBranch\Mail\OrmocEscalationMail;
use Modules\OrmocBranch\Models\OrmocBooking;

class OrmocBranchController extends Controller
{
    // ─── Roles with full write access ─────────────────────────────────────────
    private const WRITE_ROLES = [
        'general_manager',
        'ormoc_branch_officer',
    ];

    // Roles that can view Ormoc records
    private const VIEW_ROLES = [
        'general_manager',
        'ormoc_branch_officer',
        'accounting_officer',
        'disbursement_officer',
        'admin_auditor',
    ];

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user   = $request->user();
        $role   = $user?->getRoleNames()->first();
        $search = $request->get('search');
        $agent  = $request->get('agent');
        $status = $request->get('status');
        $type   = $request->get('booking_type');
        $month  = $request->get('month');
        $year   = (int) $request->get('year', now()->year);

        $query = OrmocBooking::with(['branch', 'createdBy'])
            ->latest('date');

        // Ormoc officers see only Ormoc-tagged records
        if ($role === 'ormoc_branch_officer') {
            $query->forBranch($user->branch_id);
        }

        $query->search($search);

        if ($agent) $query->forAgent($agent);
        if ($status) $query->where('status', $status);
        if ($type)   $query->where('booking_type', $type);

        if ($month) {
            [$y, $m] = explode('-', $month . '-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $bookings = $query->paginate(25)->withQueryString();

        return Inertia::render('OrmocBranch/Index', [
            'bookings'     => $bookings,
            'filters'      => compact('search', 'agent', 'status', 'type', 'month', 'year'),
            'statuses'     => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'agentCodes'   => OrmocBooking::AGENT_CODES,
            'canWrite'     => $this->canWrite($request),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireWriteAccess($request);

        return Inertia::render('OrmocBranch/Create', [
            'statuses'     => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'agentCodes'   => OrmocBooking::AGENT_CODES,
            'paymentModes' => OrmocBooking::PAYMENT_MODES,
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreOrmocBookingRequest $request): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $data = $request->validated();
        $data['created_by']   = $request->user()->id;
        $data['updated_by']   = $request->user()->id;
        $data['branch_id']    = $request->user()->branch_id;
        $data['status']       = $data['status'] ?? 'inquiry';
        $data['booking_type'] = $data['booking_type'] ?? 'domestic';

        // Auto-compute income
        if (empty($data['income']) && !empty($data['selling_price']) && !empty($data['net_payable'])) {
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
            ->route('ormoc.show', $booking)
            ->with('flash', ['type' => 'success', 'message' => 'Booking recorded.']);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, OrmocBooking $ormoc): Response
    {
        $role = $request->user()?->getRoleNames()->first();

        if (!in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        // Ormoc officers can only see their own branch records
        if ($role === 'ormoc_branch_officer' && $ormoc->branch_id !== $request->user()->branch_id) {
            abort(403);
        }

        $ormoc->load(['branch', 'createdBy', 'updatedBy', 'escalatedBy']);

        return Inertia::render('OrmocBranch/Show', [
            'booking'      => $ormoc,
            'statuses'     => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'paymentModes' => OrmocBooking::PAYMENT_MODES,
            'canWrite'     => $this->canWrite($request),
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

        return Inertia::render('OrmocBranch/Edit', [
            'booking'      => $ormoc,
            'statuses'     => OrmocBooking::STATUSES,
            'bookingTypes' => OrmocBooking::BOOKING_TYPES,
            'agentCodes'   => OrmocBooking::AGENT_CODES,
            'paymentModes' => OrmocBooking::PAYMENT_MODES,
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
        if (!isset($data['income']) && isset($data['selling_price'], $data['net_payable'])) {
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
            ->route('ormoc.show', $ormoc)
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
            'status' => ['required', 'in:' . implode(',', array_keys(OrmocBooking::STATUSES))],
        ]);

        $ormoc->update([
            'status'     => $request->status,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Status updated to ' . OrmocBooking::STATUSES[$request->status] . '.']);
    }

    // ─── Update notes ─────────────────────────────────────────────────────────

    public function updateNotes(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $this->requireWriteAccess($request);
        $request->validate(['notes' => ['nullable', 'string']]);

        $ormoc->update([
            'notes'      => $request->notes,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Notes saved.']);
    }

    // ─── Escalate to head office (Ms. Jhona Ramos) ────────────────────────────

    public function escalate(Request $request, OrmocBooking $ormoc): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if ($role !== 'ormoc_branch_officer' && $role !== 'general_manager') {
            abort(403);
        }

        if ($ormoc->escalated_to_head_office) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Booking already escalated to head office.']);
        }

        // Queue escalation email to all RESA Officers at QC head office
        $resaOfficers = User::role('resa_officer')
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
            'escalated_at'             => now(),
            'escalated_by'             => $request->user()->id,
            'booking_type'             => 'international',
            'updated_by'               => $request->user()->id,
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
            'po_sent_to_mariposa'    => true,
            'po_sent_to_mariposa_at' => now(),
            'updated_by'             => $request->user()->id,
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
            'forwarded_to_accounting'    => true,
            'forwarded_to_accounting_at' => now(),
            'status'                     => 'confirmed',
            'updated_by'                 => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Forwarded to Accounting. Booking is now locked.']);
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
        if (!$this->canWrite($request)) {
            abort(403, 'You do not have permission to modify Ormoc bookings.');
        }
    }
}
