<?php

namespace Modules\Reservation\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Reservation\Http\Requests\StoreAirlineRateRequest;
use Modules\Reservation\Models\AirlineRate;

/**
 * AirlineRateController — manually maintained airline rate reference table.
 *
 * Confirmed scope with the client: this is a reference table for staff to
 * record current fares per route/airline when quoting, not a live fare
 * integration. Data is stored per-entry (one row per rate, dated by
 * effective_date) and the Index page filters this same data by
 * day/week/month/year via the shared PeriodFilter component — the
 * granularity is a view-layer concern, not a storage concern.
 */
class AirlineRateController extends Controller
{
    // ─── Roles ─────────────────────────────────────────────────────────────────
    // Canonical slugs per Amkor_IMS___Roles___Permissions_Matrix_1.md
    // Airline Rates is a reference table used by all booking/sales staff.
    // The matrix does not have a dedicated module for it; access mirrors Reservation (Module 1).

    private const VIEW_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'general_sales_manager',
        'business_development_manager',
        'accounting_assistant',
        'administrative_assistant',
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'visa_documentation_supervisor',
        'visa_documentation_officer',
        'branch_supervisor',
        'branch_sales_officer',
    ];

    private const WRITE_ROLES = [
        'president',
        'chief_operating_officer',
        'general_sales_manager',
        'accounting_assistant',
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'branch_supervisor',
    ];

    public function index(Request $request): Response
    {    $perPage = max(5, min(100, (int) $request->get('per_page', 25)));

        $this->requireViewer($request);

        $filters = [
            'search'    => $request->string('search')->toString() ?: null,
            'date_from' => $request->string('date_from')->toString() ?: null,
            'date_to'   => $request->string('date_to')->toString() ?: null,
            'period'    => $request->string('period')->toString() ?: 'day',
            'anchor'    => $request->string('anchor')->toString() ?: null,
        ];

        $rates = AirlineRate::query()
            ->with('createdBy')
            ->search($filters['search'])
            ->betweenDates($filters['date_from'], $filters['date_to'])
            ->orderByDesc('effective_date')
            ->orderBy('airline')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Reservation/AirlineRates/Index', [
            'rates'      => $rates,
            'filters'    => $filters,
            'currencies' => AirlineRate::CURRENCIES,
            'canWrite'   => $this->canWrite($request),
        ]);
    }

    public function store(StoreAirlineRateRequest $request): RedirectResponse
    {
        $this->requireWriteAccess($request);

        AirlineRate::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Airline rate added.']);
    }

    public function update(StoreAirlineRateRequest $request, AirlineRate $airlineRate): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $airlineRate->update([
            ...$request->validated(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Airline rate updated.']);
    }

    public function destroy(Request $request, AirlineRate $airlineRate): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $airlineRate->delete();

        return back()->with('flash', ['type' => 'success', 'message' => 'Airline rate deleted.']);
    }

    /**
     * JSON search endpoint — called by the booking form (Form.jsx) for
     * ticketing bookings to populate the airline+route dropdown and
     * auto-fill net payable from the stored rate.
     *
     * GET /airline-rates/search?q={term}
     *   Returns a lightweight list of matching rates ordered by most recent
     *   effective_date first, so staff always see the current rate at the top.
     *
     * Returns per entry:
     *   id, airline, origin, destination, fare_class, rate, currency, effective_date
     *
     * The label shown in the dropdown is built on the frontend:
     *   "{airline} {origin}→{destination} {fare_class} — {currency} {rate}"
     */
    public function search(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->requireViewer($request);

        $term = $request->string('q')->toString() ?: null;

        $rates = AirlineRate::query()
            ->search($term)
            ->orderByDesc('effective_date')
            ->orderBy('airline')
            ->orderBy('origin')
            ->orderBy('destination')
            ->limit(50)
            ->get()
            ->map(fn (AirlineRate $r) => [
                'id'             => $r->id,
                'airline'        => $r->airline,
                'origin'         => $r->origin,
                'destination'    => $r->destination,
                'fare_class'     => $r->fare_class,
                'rate'           => $r->rate,
                'currency'       => $r->currency,
                'effective_date' => $r->effective_date?->toDateString(),
            ]);

        return response()->json($rates);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function canWrite(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::WRITE_ROLES, true);
    }

    private function requireViewer(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first() ?? '', self::VIEW_ROLES, true)) {
            abort(403);
        }
    }

    private function requireWriteAccess(Request $request): void
    {
        if (! $this->canWrite($request)) {
            abort(403, 'You do not have permission to manage airline rates.');
        }
    }
}
