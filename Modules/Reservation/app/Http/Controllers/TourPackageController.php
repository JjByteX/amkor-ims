<?php

namespace Modules\Reservation\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Reservation\Http\Requests\StoreTourPackageRequest;
use Modules\Reservation\Models\TourPackage;

/**
 * TourPackageController — company-wide tour package catalogue.
 *
 * Staff with write access maintain the directory here; the booking form
 * calls the `search` endpoint to autofill inclusions, exclusions,
 * particulars, and selling price when a package is selected.
 *
 * Write access is restricted to management roles — the same people who
 * approve pricing on airline rates and other reference tables.
 *
 * The `search` endpoint is JSON-only (no Inertia) because it is called
 * client-side from Form.jsx on package selection, not as a page navigation.
 */
class TourPackageController extends Controller
{
    // ─── Roles ────────────────────────────────────────────────────────────────
    // Canonical slugs per Amkor_IMS___Roles___Permissions_Matrix
    // Tour packages are company-wide pricing reference data — management maintains,
    // all booking/sales roles can view and use via the booking form selector.

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
    ];

    // ─── Actions ──────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->requireViewer($request);

        $perPage = max(5, min(100, (int) $request->get('per_page', 25)));

        $filters = [
            'search'  => $request->string('search')->toString() ?: null,
            'country' => $request->string('country')->toString() ?: null,
        ];

        $packages = TourPackage::query()
            ->search($filters['search'])
            ->byCountry($filters['country'])
            ->orderBy('country')
            ->orderBy('package_name')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Reservation/TourPackages/Index', [
            'packages'  => $packages,
            'filters'   => $filters,
            'countries' => TourPackage::countries(),
            'canWrite'  => $this->canWrite($request),
        ]);
    }

    public function store(StoreTourPackageRequest $request): RedirectResponse
    {
        $this->requireWriteAccess($request);

        TourPackage::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Tour package added.']);
    }

    public function update(StoreTourPackageRequest $request, TourPackage $tourPackage): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $tourPackage->update([
            ...$request->validated(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Tour package updated.']);
    }

    public function destroy(Request $request, TourPackage $tourPackage): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $tourPackage->delete();

        return back()->with('flash', ['type' => 'success', 'message' => 'Tour package deleted.']);
    }

    /**
     * JSON endpoint — called by Form.jsx when a package is selected.
     *
     * Returns all fields needed to autofill the booking form:
     * inclusions, exclusions, particulars, destinations, tour_costs,
     * departure_dates (with surcharges), and convenience helpers
     * (lowestPrice, nextDeparture) so the frontend doesn't have to
     * reimplement the matching logic.
     *
     * GET /tour-packages/search?id={id}
     *   — fetch a specific package by ID (used after selection)
     *
     * GET /tour-packages/search?q={term}
     *   — search by name/country for the combobox dropdown options
     *     returns a lightweight list (id, country, package_name, destinations, lowestPrice)
     */
    public function search(Request $request): JsonResponse
    {
        $this->requireViewer($request);

        // Fetch a single package by ID — called after the user selects one
        if ($id = $request->integer('id')) {
            $package = TourPackage::active()->findOrFail($id);

            return response()->json([
                'id'              => $package->id,
                'country'         => $package->country,
                'package_name'    => $package->package_name,
                'destinations'    => $package->destinations,
                'duration_days'   => $package->duration_days,
                'duration_nights' => $package->duration_nights,
                'particulars'     => $package->particulars,
                'inclusions'      => $package->inclusions,
                'exclusions'      => $package->exclusions,
                'airline'         => $package->airline,
                'tour_costs'      => $package->tour_costs ?? [],
                'departure_dates' => $package->departure_dates ?? [],
                'lowest_price'    => $package->lowestPrice(),
                'next_departure'  => $package->nextDeparture(),
            ]);
        }

        // Search by term — populates the combobox dropdown
        $term = $request->string('q')->toString() ?: null;

        $packages = TourPackage::active()
            ->search($term)
            ->orderBy('country')
            ->orderBy('package_name')
            ->get()
            ->map(fn (TourPackage $p) => [
                'id'           => $p->id,
                'country'      => $p->country,
                'package_name' => $p->package_name,
                'destinations' => $p->destinations,
                'lowest_price' => $p->lowestPrice(),
            ]);

        return response()->json($packages);
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
            abort(403, 'You do not have permission to manage tour packages.');
        }
    }
}
