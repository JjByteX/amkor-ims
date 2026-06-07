<?php

namespace Modules\Marketing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Marketing\Models\MarketingAnalytics;
use Modules\Marketing\Models\MarketingExpense;
use Modules\Marketing\Models\MarketingMaterial;

class MarketingController extends Controller
{
    // ── Role constants (per Roles.md) ─────────────────────────────────────────
    private const MARKETER_ROLES = ['marketing_officer'];

    private const REVIEWER_ROLES = ['chief_operations_officer', 'general_manager'];

    private const VIEW_ROLES = ['marketing_officer', 'chief_operations_officer', 'general_manager'];

    // ════════════════════════════════════════════════════════════════════════
    // MATERIALS — Index
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $status = $request->get('status');
        $type = $request->get('type');
        $year = (int) $request->get('year', now()->year);

        $materials = MarketingMaterial::with(['createdBy', 'approvedBy'])
            ->search($search)
            ->forStatus($status)
            ->forType($type)
            ->forYear($year)
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        // Status summary counts for the year
        $summary = [];
        foreach (array_keys(MarketingMaterial::STATUSES) as $s) {
            $summary[$s] = MarketingMaterial::forStatus($s)->forYear($year)->count();
        }

        return Inertia::render('Marketing/Index', [
            'materials' => $materials,
            'summary' => $summary,
            'filters' => compact('search', 'status', 'type', 'year'),
            'materialTypes' => MarketingMaterial::MATERIAL_TYPES,
            'statuses' => MarketingMaterial::STATUSES,
            'platforms' => MarketingMaterial::PLATFORMS,
            'canCreate' => $this->canCreate($request),
            'canReview' => $this->canReview($request),
            'currentYear' => now()->year,
        ]);
    }

    // ── Materials — Create ───────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireMarketer($request);

        return Inertia::render('Marketing/Form', [
            'material' => null,
            'materialTypes' => MarketingMaterial::MATERIAL_TYPES,
            'platforms' => MarketingMaterial::PLATFORMS,
            'mode' => 'create',
        ]);
    }

    // ── Materials — Store ────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $this->requireMarketer($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'material_type' => ['required', 'in:'.implode(',', array_keys(MarketingMaterial::MATERIAL_TYPES))],
            'description' => ['nullable', 'string'],
            'platform' => ['nullable', 'string', 'max:100'],
            'caption' => ['nullable', 'string'],
            'publish_date' => ['nullable', 'date'],
        ]);

        $data['status'] = 'draft';
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $material = MarketingMaterial::create($data);

        return redirect()
            ->route('marketing.show', $material)
            ->with('flash', ['type' => 'success', 'message' => "Material \"{$material->title}\" created."]);
    }

    // ── Materials — Show ─────────────────────────────────────────────────────

    public function show(Request $request, MarketingMaterial $marketing): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $marketing->load([
            'createdBy', 'submittedBy', 'approvedBy', 'publishedBy', 'updatedBy',
            'expenses', 'analytics',
        ]);

        $totalSpend = $marketing->expenses->sum('amount');

        return Inertia::render('Marketing/Show', [
            'material' => $marketing,
            'totalSpend' => $totalSpend,
            'materialTypes' => MarketingMaterial::MATERIAL_TYPES,
            'statuses' => MarketingMaterial::STATUSES,
            'platforms' => MarketingMaterial::PLATFORMS,
            'canCreate' => $this->canCreate($request),
            'canReview' => $this->canReview($request),
        ]);
    }

    // ── Materials — Edit ─────────────────────────────────────────────────────

    public function edit(Request $request, MarketingMaterial $marketing): Response
    {
        $this->requireMarketer($request);

        if (! in_array($marketing->status, ['draft', 'archived'], true)) {
            return redirect()->route('marketing.show', $marketing)
                ->with('flash', ['type' => 'error', 'message' => 'Only draft or archived materials can be edited.']);
        }

        return Inertia::render('Marketing/Form', [
            'material' => $marketing,
            'materialTypes' => MarketingMaterial::MATERIAL_TYPES,
            'platforms' => MarketingMaterial::PLATFORMS,
            'mode' => 'edit',
        ]);
    }

    // ── Materials — Update ───────────────────────────────────────────────────

    public function update(Request $request, MarketingMaterial $marketing): RedirectResponse
    {
        $this->requireMarketer($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'material_type' => ['required', 'in:'.implode(',', array_keys(MarketingMaterial::MATERIAL_TYPES))],
            'description' => ['nullable', 'string'],
            'platform' => ['nullable', 'string', 'max:100'],
            'caption' => ['nullable', 'string'],
            'publish_date' => ['nullable', 'date'],
        ]);

        $data['updated_by'] = $request->user()->id;
        $marketing->update($data);

        return redirect()
            ->route('marketing.show', $marketing)
            ->with('flash', ['type' => 'success', 'message' => 'Material updated.']);
    }

    // ── Materials — Submit for review ────────────────────────────────────────

    public function submit(Request $request, MarketingMaterial $marketing): RedirectResponse
    {
        $this->requireMarketer($request);

        if ($marketing->status !== 'draft') {
            return back()->with('flash', ['type' => 'error', 'message' => 'Only draft materials can be submitted.']);
        }

        $marketing->update([
            'status' => 'submitted',
            'submitted_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()
            ->route('marketing.show', $marketing)
            ->with('flash', ['type' => 'success', 'message' => 'Material submitted for COO review.']);
    }

    // ── Materials — Approve (COO / JRT) ──────────────────────────────────────

    public function approve(Request $request, MarketingMaterial $marketing): RedirectResponse
    {
        $this->requireReviewer($request);

        if ($marketing->status !== 'submitted') {
            return back()->with('flash', ['type' => 'error', 'message' => 'Only submitted materials can be approved.']);
        }

        $marketing->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return redirect()
            ->route('marketing.show', $marketing)
            ->with('flash', ['type' => 'success', 'message' => 'Material approved.']);
    }

    // ── Materials — Reject / send back to draft ───────────────────────────────

    public function reject(Request $request, MarketingMaterial $marketing): RedirectResponse
    {
        $this->requireReviewer($request);

        $data = $request->validate([
            'revision_notes' => ['required', 'string', 'max:1000'],
        ]);

        if ($marketing->status !== 'submitted') {
            return back()->with('flash', ['type' => 'error', 'message' => 'Only submitted materials can be sent back.']);
        }

        $marketing->update([
            'status' => 'draft',
            'revision_notes' => $data['revision_notes'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return redirect()
            ->route('marketing.show', $marketing)
            ->with('flash', ['type' => 'warning', 'message' => 'Material sent back for revision.']);
    }

    // ── Materials — Publish ───────────────────────────────────────────────────

    public function publish(Request $request, MarketingMaterial $marketing): RedirectResponse
    {
        $this->requireMarketer($request);

        if ($marketing->status !== 'approved') {
            return back()->with('flash', ['type' => 'error', 'message' => 'Only approved materials can be published.']);
        }

        $marketing->update([
            'status' => 'published',
            'published_by' => $request->user()->id,
            'published_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return redirect()
            ->route('marketing.show', $marketing)
            ->with('flash', ['type' => 'success', 'message' => 'Material marked as published.']);
    }

    // ── Materials — Archive ───────────────────────────────────────────────────

    public function archive(Request $request, MarketingMaterial $marketing): RedirectResponse
    {
        $this->requireMarketer($request);

        $marketing->update([
            'status' => 'archived',
            'updated_by' => $request->user()->id,
        ]);

        return redirect()
            ->route('marketing.index')
            ->with('flash', ['type' => 'success', 'message' => 'Material archived.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // EXPENSES
    // ════════════════════════════════════════════════════════════════════════

    public function expenses(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $category = $request->get('category');
        $status = $request->get('status');
        $year = (int) $request->get('year', now()->year);
        $month = $request->get('month') ? (int) $request->get('month') : null;

        $query = MarketingExpense::with(['createdBy', 'approvedBy', 'material'])
            ->search($search)
            ->forCategory($category)
            ->forStatus($status)
            ->forYear($year);

        if ($month) {
            $query->forPeriod($month, null);
        }

        $expenses = $query->orderByDesc('expense_date')->paginate(30)->withQueryString();

        // Monthly totals for the selected year
        $monthlyTotals = MarketingExpense::forYear($year)
            ->selectRaw('period_month, sum(amount) as total')
            ->groupBy('period_month')
            ->orderBy('period_month')
            ->pluck('total', 'period_month');

        $yearTotal = MarketingExpense::forYear($year)->sum('amount');

        return Inertia::render('Marketing/Expenses', [
            'expenses' => $expenses,
            'monthlyTotals' => $monthlyTotals,
            'yearTotal' => $yearTotal,
            'filters' => compact('search', 'category', 'status', 'year', 'month'),
            'categories' => MarketingExpense::CATEGORIES,
            'statuses' => MarketingExpense::STATUSES,
            'currencies' => MarketingExpense::CURRENCIES,
            'canCreate' => $this->canCreate($request),
            'canApprove' => $this->canReview($request),
            'currentYear' => now()->year,
        ]);
    }

    // ── Expenses — Store ─────────────────────────────────────────────────────

    public function storeExpense(Request $request): RedirectResponse
    {
        $this->requireMarketer($request);

        $data = $request->validate([
            'campaign_name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:'.implode(',', array_keys(MarketingExpense::CATEGORIES))],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', 'in:'.implode(',', MarketingExpense::CURRENCIES)],
            'expense_date' => ['required', 'date'],
            'period_month' => ['required', 'integer', 'min:1', 'max:12'],
            'period_year' => ['required', 'integer', 'min:2020', 'max:2099'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
            'material_id' => ['nullable', 'exists:marketing_materials,id'],
        ]);

        $data['currency'] = $data['currency'] ?? 'PHP';
        $data['status'] = 'draft';
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $expense = MarketingExpense::create($data);

        return redirect()
            ->route('marketing.expenses')
            ->with('flash', ['type' => 'success', 'message' => "Expense \"{$expense->campaign_name}\" recorded."]);
    }

    // ── Expenses — Approve ───────────────────────────────────────────────────

    public function approveExpense(Request $request, MarketingExpense $expense): RedirectResponse
    {
        $this->requireReviewer($request);

        $expense->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Expense approved.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════

    public function analytics(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $year = (int) $request->get('year', now()->year);

        // Aggregate analytics per platform for the year
        $byPlatform = MarketingAnalytics::whereHas('material', fn ($q) => $q->whereYear('created_at', $year))
            ->orWhereYear('recorded_date', $year)
            ->selectRaw('platform, sum(reach) as reach, sum(impressions) as impressions, sum(engagements) as engagements, sum(clicks) as clicks, sum(spend) as spend')
            ->groupBy('platform')
            ->get();

        // Material counts by status
        $materialSummary = [];
        foreach (array_keys(MarketingMaterial::STATUSES) as $s) {
            $materialSummary[$s] = MarketingMaterial::forStatus($s)->forYear($year)->count();
        }

        // Expense total for the year
        $expenseTotal = MarketingExpense::forYear($year)->sum('amount');

        // Top campaigns by spend
        $topCampaigns = MarketingExpense::forYear($year)
            ->selectRaw('campaign_name, sum(amount) as total')
            ->groupBy('campaign_name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return Inertia::render('Marketing/Analytics', [
            'byPlatform' => $byPlatform,
            'materialSummary' => $materialSummary,
            'expenseTotal' => $expenseTotal,
            'topCampaigns' => $topCampaigns,
            'year' => $year,
            'currentYear' => now()->year,
            'statuses' => MarketingMaterial::STATUSES,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function canCreate(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first(), self::MARKETER_ROLES, true);
    }

    private function canReview(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first(), self::REVIEWER_ROLES, true);
    }

    private function requireMarketer(Request $request): void
    {
        if (! $this->canCreate($request)) {
            abort(403);
        }
    }

    private function requireReviewer(Request $request): void
    {
        if (! $this->canReview($request)) {
            abort(403);
        }
    }
}
