<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Modules\Contacts\Http\Requests\StoreContactRequest;
use Modules\Contacts\Models\Contact;

class ContactsController extends Controller
{
    // ─── Roles ─────────────────────────────────────────────────────────────────
    // Canonical slugs per Amkor_IMS___Roles___Permissions_Matrix_1.md (Module 16)

    // Full write — can create + edit ANY contact
    private const FULL_WRITE_ROLES = [
        'president',
        'general_sales_manager',
        'business_development_manager',
        'visa_documentation_supervisor',
    ];

    // Own-record write — can create contacts and edit only their own entries (🔒)
    private const OWN_WRITE_ROLES = [
        'visa_documentation_officer',
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'branch_supervisor',
        'branch_sales_officer',
    ];

    // Combined — any role that may call store() / create()
    private const WRITE_ROLES = [
        'president',
        'general_sales_manager',
        'business_development_manager',
        'visa_documentation_supervisor',
        'visa_documentation_officer',
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'branch_supervisor',
        'branch_sales_officer',
    ];

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $type = $request->get('type', 'corporate');
        $search = $request->get('search');
        $active = $request->get('active', 'all'); // all | active | inactive

                $perPage = max(5, min(100, (int) $request->get('per_page', 20)));
$query = Contact::query()
            ->where('type', $type)
            ->search($search)
            ->orderBy('name');

        if ($active === 'active') {
            $query->where('is_active', true);
        } elseif ($active === 'inactive') {
            $query->where('is_active', false);
        }

        $contacts = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
            'filters' => [
                'type' => $type,
                'search' => $search,
                'active' => $active,
                'per_page' => $perPage,
            ],
            'canWrite' => $this->canWrite($request),
            'typeCounts' => $this->typeCounts(),
        ]);
    }

    // ─── Typeahead search (JSON) ───────────────────────────────────────────────
    //
    // GET /contacts/search?q=Acme&limit=10
    //
    // Returns a slim list of matching active contacts for the contact_id picker
    // used on booking and visa forms. Only fields needed to populate TIN, address,
    // and business_style are returned — no PII beyond what the form already shows.
    //
    // Available to all authenticated roles (same read access as contacts.index).

    public function search(Request $request): JsonResponse
    {
        $term  = $request->string('q')->trim()->toString();
        $limit = min((int) $request->get('limit', 10), 25);

        $contacts = Contact::active()
            ->search($term)
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'tin', 'address', 'type']);

        return response()->json($contacts);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireWriteAccess($request);

        return Inertia::render('Contacts/Form', [
            'contact' => null,
            'types' => Contact::TYPES,
            'currencies' => Contact::CURRENCIES,
            'defaultType' => $request->get('type', 'corporate'),
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreContactRequest $request): RedirectResponse
    {
        $this->requireWriteAccess($request);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id ?? null;
        $data['currency'] = $data['currency'] ?? 'PHP';
        $data['is_active'] = $data['is_active'] ?? true;

        Contact::create($data);

        return redirect()
            ->route('contacts.index', ['type' => $data['type']])
            ->with('flash', ['type' => 'success', 'message' => 'Contact created successfully.']);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, Contact $contact): Response|JsonResponse
    {
        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'contact' => $contact->load(['branch', 'createdBy', 'updatedBy']),
            'canWrite' => $this->canWrite($request),
        ]);
        }
        return Inertia::render('Contacts/Show', [
            'contact' => $contact->load(['branch', 'createdBy', 'updatedBy']),
            'canWrite' => $this->canWrite($request),
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Request $request, Contact $contact): Response
    {
        $this->requireWriteAccess($request);

        // Own-record roles may only edit contacts they created (🔒)
        $role = $request->user()?->getRoleNames()->first();
        if (in_array($role, self::OWN_WRITE_ROLES, true) && $contact->created_by !== $request->user()->id) {
            abort(403, 'You can only edit contacts you created.');
        }

        return Inertia::render('Contacts/Form', [
            'contact' => $contact,
            'types' => Contact::TYPES,
            'currencies' => Contact::CURRENCIES,
            'defaultType' => $contact->type,
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(StoreContactRequest $request, Contact $contact): RedirectResponse
    {
        $this->requireWriteAccess($request);

        // Own-record roles may only update contacts they created (🔒)
        $role = $request->user()?->getRoleNames()->first();
        if (in_array($role, self::OWN_WRITE_ROLES, true) && $contact->created_by !== $request->user()->id) {
            abort(403, 'You can only edit contacts you created.');
        }

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        $contact->update($data);

        return redirect()
            ->route('contacts.index')
            ->with('flash', ['type' => 'success', 'message' => 'Contact updated successfully.']);
    }

    // ─── Destroy (soft delete) ────────────────────────────────────────────────

    public function destroy(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireWriteAccess($request);

        // Soft delete only — no hard deletes per system rules
        $contact->delete();

        return redirect()
            ->route('contacts.index', ['type' => $contact->type])
            ->with('flash', ['type' => 'success', 'message' => 'Contact removed.']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function canWrite(Request $request): bool
    {
        $role = $request->user()?->getRoleNames()->first() ?? '';

        return in_array($role, self::WRITE_ROLES, true);
    }

    private function requireWriteAccess(Request $request): void
    {
        if (! $this->canWrite($request)) {
            abort(403, 'You do not have permission to modify contacts.');
        }
    }

    private function typeCounts(): array
    {
        return Contact::query()
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type')
            ->toArray();
    }
}
