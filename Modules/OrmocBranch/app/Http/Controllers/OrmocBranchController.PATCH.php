<?php
/**
 * PATCH — OrmocBranchController::show()
 *
 * Add these two `use` statements after the existing ones (if not already present):
 *
 *   use Modules\Reservation\Models\ReservationBooking;
 *   use Modules\Visa\Models\VisaApplication;
 *
 * Then replace the existing show() method with this version.
 */

// ── ADD these use statements near the top of the file ──────────────────────
// use Modules\Reservation\Models\ReservationBooking;
// use Modules\Visa\Models\VisaApplication;

    public function show(Request $request, OrmocBooking $ormoc): Response|JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        // Ormoc officers can only see their own branch records
        if ($role === 'ormoc_branch_officer' && $ormoc->branch_id !== $request->user()->branch_id) {
            abort(403);
        }

        $ormoc->load(['branch', 'createdBy', 'updatedBy', 'escalatedBy', 'contact']);

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
                'booking'             => $ormoc,
                'statuses'            => OrmocBooking::STATUSES,
                'bookingTypes'        => OrmocBooking::BOOKING_TYPES,
                'paymentModes'        => OrmocBooking::PAYMENT_MODES,
                'canWrite'            => $this->canWrite($request),
                'contactsSearchUrl'   => route('contacts.search'),
                'relatedTransactions' => $relatedTransactions,
            ]);
        }

        return Inertia::render('OrmocBranch/Show', [
            'booking'             => $ormoc,
            'statuses'            => OrmocBooking::STATUSES,
            'bookingTypes'        => OrmocBooking::BOOKING_TYPES,
            'paymentModes'        => OrmocBooking::PAYMENT_MODES,
            'canWrite'            => $this->canWrite($request),
            'contactsSearchUrl'   => route('contacts.search'),
            'relatedTransactions' => $relatedTransactions,
        ]);
    }
