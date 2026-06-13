<?php
/**
 * PATCH — VisaController::show()
 *
 * Add these two `use` statements after the existing ones (if not already present):
 *
 *   use Modules\Reservation\Models\ReservationBooking;
 *   use Modules\OrmocBranch\Models\OrmocBooking;
 *
 * Then replace the existing show() method with this version.
 */

// ── ADD these use statements near the top of the file ──────────────────────
// use Modules\Reservation\Models\ReservationBooking;
// use Modules\OrmocBranch\Models\OrmocBooking;

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
                'application'          => $visa,
                'statuses'             => VisaApplication::STATUSES,
                'paymentModes'         => VisaApplication::PAYMENT_MODES,
                'canWrite'             => $this->canWrite($request),
                'canEndorse'           => $role === 'visa_documentation_officer' && $visa->or_number && ! $visa->isEndorsed(),
                'contactsSearchUrl'    => route('contacts.search'),
                'relatedTransactions'  => $relatedTransactions,
            ]);
        }

        return Inertia::render('Visa/Show', [
            'application'          => $visa,
            'statuses'             => VisaApplication::STATUSES,
            'paymentModes'         => VisaApplication::PAYMENT_MODES,
            'canWrite'             => $this->canWrite($request),
            'canEndorse'           => $role === 'visa_documentation_officer' && $visa->or_number && ! $visa->isEndorsed(),
            'contactsSearchUrl'    => route('contacts.search'),
            'relatedTransactions'  => $relatedTransactions,
        ]);
    }
