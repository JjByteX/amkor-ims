<?php
/**
 * PATCH — ReservationController::show()
 *
 * Add these two `use` statements after the existing ones (if not already present):
 *
 *   use Modules\OrmocBranch\Models\OrmocBooking;
 *   use Modules\Visa\Models\VisaApplication;
 *
 * Then replace the existing show() method with this version.
 * The only addition is the $relatedTransactions query and the new prop.
 */

// ── ADD these use statements near the top of the file ──────────────────────
// use Modules\OrmocBranch\Models\OrmocBooking;
// use Modules\Visa\Models\VisaApplication;

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
                'booking'              => $booking,
                'statuses'             => ReservationBooking::STATUSES,
                'serviceTypes'         => ReservationBooking::SERVICE_TYPES,
                'paymentModes'         => ReservationBooking::PAYMENT_MODES,
                'canWrite'             => $this->canWrite($request),
                'contactsSearchUrl'    => route('contacts.search'),
                'relatedTransactions'  => $relatedTransactions,
            ]);
        }

        return Inertia::render('Reservation/Show', [
            'booking'              => $booking,
            'statuses'             => ReservationBooking::STATUSES,
            'serviceTypes'         => ReservationBooking::SERVICE_TYPES,
            'paymentModes'         => ReservationBooking::PAYMENT_MODES,
            'canWrite'             => $this->canWrite($request),
            'contactsSearchUrl'    => route('contacts.search'),
            'relatedTransactions'  => $relatedTransactions,
        ]);
    }
