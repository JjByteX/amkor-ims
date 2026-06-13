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
    private const VIEW_ROLES = [
        'general_manager',
        'chief_operations_officer',
        'general_sales_manager',
        'accounting_officer',
        'resa_officer',
        'ormoc_branch_officer',
        'admin_auditor',
        'visa_documentation_officer',
    ];

    private const WRITE_ROLES = [
        'general_manager',
        'chief_operations_officer',
        'general_sales_manager',
        'accounting_officer',
        'resa_officer',
        'ormoc_branch_officer',
    ];

    public function index(Request $request): Response
    {
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
            ->paginate(25)
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
