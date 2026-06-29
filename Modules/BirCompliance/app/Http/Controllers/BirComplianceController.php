<?php

namespace Modules\BirCompliance\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Modules\BirCompliance\Exports\BirMonthlyExport;
use Modules\BirCompliance\Http\Requests\StoreBirTransactionRequest;
use Modules\BirCompliance\Models\BirTransaction;

class BirComplianceController extends Controller
{
    // From Roles.md Module 11: view = president, coo, finance_admin_supervisor, administrative_assistant, general_sales_manager, accounting_assistant
    // Generate/manage = president + accounting_assistant only; audit remarks (update only) = administrative_assistant
    private const VIEW_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'general_sales_manager',
        'accounting_assistant',
    ];

    // Can create, store, export — full generate access (M11: Create ✅ = president + accounting_assistant)
    private const GENERATE_ROLES = [
        'president',
        'accounting_assistant',
    ];

    // Can update existing records — includes admin assistant for audit remarks (M11: Update ✏️)
    private const AUDIT_ROLES = [
        'president',
        'accounting_assistant',
        'administrative_assistant',
    ];

    // ════════════════════════════════════════════════════════════════════════
    // INDEX
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $this->requireViewAccess($request);

        $year = (int) $request->get('year', now()->year);
        $month = $request->get('month');
        $type = $request->get('document_type');
        $search = $request->get('search');
        $branch = $request->get('branch_id');

        $role = $request->user()?->getRoleNames()->first();

                $perPage = max(5, min(100, (int) $request->get('per_page', 25)));
$query = BirTransaction::with(['branch', 'createdBy'])
            ->forYear($year)
            ->forMonth($month ? (int) $month : null)
            ->forDocumentType($type)
            ->search($search)
            ->latest('transaction_date');

        if (! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'general_sales_manager', 'accounting_assistant'], true)) {
            $query->forBranch($request->user()->branch_id);
        } elseif ($branch) {
            $query->forBranch((int) $branch);
        }

        $transactions = $query->paginate($perPage)->withQueryString();

        $monthlySummary = BirTransaction::forYear($year)
            ->when(! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'general_sales_manager', 'accounting_assistant'], true), function ($q) use ($request) {
                $q->forBranch($request->user()->branch_id);
            })
            ->selectRaw('month, document_type, COUNT(*) as count,
                SUM(gross_amount) as total_gross, SUM(vat_amount) as total_vat,
                SUM(net_amount_due) as total_net')
            ->groupByRaw('month, document_type')
            ->orderBy('month')
            ->get();

        $totals = BirTransaction::forYear($year)
            ->forMonth($month ? (int) $month : null)
            ->forDocumentType($type)
            ->when(! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'general_sales_manager', 'accounting_assistant'], true), function ($q) use ($request) {
                $q->forBranch($request->user()->branch_id);
            })
            ->selectRaw('COUNT(*) as total_count,
                SUM(gross_amount) as total_gross, SUM(vatable_sales) as total_vatable,
                SUM(vat_exempt_sales) as total_exempt, SUM(vat_zero_rated_sales) as total_zero_rated,
                SUM(vat_amount) as total_vat, SUM(withholding_tax) as total_wht,
                SUM(net_amount_due) as total_net')
            ->first();

        return Inertia::render('BirCompliance/Index', [
            'transactions' => $transactions,
            'monthlySummary' => $monthlySummary,
            'totals' => $totals,
            'filters' => compact('year', 'month', 'type', 'search', 'branch') + ['per_page' => $perPage],
            'documentTypes' => BirTransaction::DOCUMENT_TYPES,
            'months' => $this->monthNames(),
            'currentYear' => now()->year,
            'years' => range(now()->year, now()->year - 5),
            'canGenerate' => $this->canGenerate($request),
        ]);
    }

    public function show(Request $request, BirTransaction $birTransaction): Response|JsonResponse
    {
        $this->requireViewAccess($request);
        $birTransaction->load(['branch', 'createdBy', 'updatedBy']);

        $payload = [
            'transaction'   => $birTransaction,
            'documentTypes' => BirTransaction::DOCUMENT_TYPES,
            'sourceTypes'   => BirTransaction::SOURCE_TYPES,
            'paymentModes'  => BirTransaction::PAYMENT_MODES,
            'canGenerate'   => $this->canGenerate($request),
            'atpNumber'     => BirTransaction::BIR_ATP_NUMBER,
        ];

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json($payload);
        }

        return Inertia::render('BirCompliance/Show', $payload);
    }

    public function create(Request $request): Response
    {
        $this->requireGenerateAccess($request);

        return Inertia::render('BirCompliance/Create', [
            'documentTypes' => BirTransaction::DOCUMENT_TYPES,
            'sourceTypes' => BirTransaction::SOURCE_TYPES,
            'paymentModes' => BirTransaction::PAYMENT_MODES,
            'vatRate' => BirTransaction::VAT_RATE,
            'whtRate' => BirTransaction::WHT_RATE,
            'atpNumber' => BirTransaction::BIR_ATP_NUMBER,
            'months' => $this->monthNames(),
        ]);
    }

    public function store(StoreBirTransactionRequest $request): RedirectResponse
    {
        $this->requireGenerateAccess($request);

        $data = $request->validated();

        if (empty($data['document_number'])) {
            $data['document_number'] = BirTransaction::nextDocumentNumber($data['document_type']);
        }

        if ($data['document_type'] === 'SI') {
            $data['bir_atp_number'] = BirTransaction::BIR_ATP_NUMBER;
        }

        $txDate = Carbon::parse($data['transaction_date']);
        $data['year'] = $txDate->year;
        $data['month'] = $txDate->month;

        $vatBreakdown = BirTransaction::computeVatBreakdown(
            grossAmount: (float) $data['gross_amount'],
            vatExempt: (bool) ($data['is_vat_exempt'] ?? false),
            vatZeroRated: (bool) ($data['is_vat_zero_rated'] ?? false),
            scPwdDiscount: (float) ($data['sc_pwd_discount'] ?? 0),
            withholdingTax: (float) ($data['withholding_tax'] ?? 0)
        );

        $data = array_merge($data, $vatBreakdown);
        unset($data['is_vat_exempt'], $data['is_vat_zero_rated']);

        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id;
        $data['branch_code'] = $request->user()->branch?->code ?? null;

        $tx = BirTransaction::create($data);

        return redirect()
            ->route('bir.index')
            ->with('flash', ['type' => 'success', 'message' => "BIR transaction {$tx->document_number} created."]);
    }

    public function edit(Request $request, BirTransaction $birTransaction): Response
    {
        $this->requireAuditAccess($request);

        return Inertia::render('BirCompliance/Edit', [
            'transaction' => $birTransaction,
            'documentTypes' => BirTransaction::DOCUMENT_TYPES,
            'sourceTypes' => BirTransaction::SOURCE_TYPES,
            'paymentModes' => BirTransaction::PAYMENT_MODES,
            'vatRate' => BirTransaction::VAT_RATE,
            'whtRate' => BirTransaction::WHT_RATE,
            'atpNumber' => BirTransaction::BIR_ATP_NUMBER,
            'months' => $this->monthNames(),
        ]);
    }

    public function update(StoreBirTransactionRequest $request, BirTransaction $birTransaction): RedirectResponse
    {
        $this->requireAuditAccess($request);

        $data = $request->validated();

        $txDate = Carbon::parse($data['transaction_date']);
        $data['year'] = $txDate->year;
        $data['month'] = $txDate->month;

        $vatBreakdown = BirTransaction::computeVatBreakdown(
            grossAmount: (float) $data['gross_amount'],
            vatExempt: (bool) ($data['is_vat_exempt'] ?? false),
            vatZeroRated: (bool) ($data['is_vat_zero_rated'] ?? false),
            scPwdDiscount: (float) ($data['sc_pwd_discount'] ?? 0),
            withholdingTax: (float) ($data['withholding_tax'] ?? 0)
        );

        $data = array_merge($data, $vatBreakdown);
        unset($data['is_vat_exempt'], $data['is_vat_zero_rated']);

        if ($data['document_type'] === 'SI') {
            $data['bir_atp_number'] = BirTransaction::BIR_ATP_NUMBER;
        }

        $data['updated_by'] = $request->user()->id;
        $birTransaction->update($data);

        return redirect()
            ->route('bir.index')
            ->with('flash', ['type' => 'success', 'message' => 'Transaction updated.']);
    }

    public function destroy(Request $request, BirTransaction $birTransaction): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        if ($role !== 'president') {
            abort(403);
        }

        $birTransaction->delete();

        return redirect()
            ->route('bir.index')
            ->with('flash', ['type' => 'success', 'message' => 'Transaction removed.']);
    }

    // ════════════════════════════════════════════════════════════════════════
    // EXPORT — Phase 10
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Download the monthly BIR sales register as a formatted Excel file.
     *
     * Covers all AR and SI transactions for the selected month/year.
     * The file is formatted for BIR submission review — the accounting team
     * uploads it to eBIR themselves.
     *
     * Query parameters:
     *   year       int   (default: current year)
     *   month      int   1–12 (default: current month)
     *   branch_id  int   optional — GMs and auditors only; others are scoped to their own branch
     */
    public function exportMonthly(Request $request)
    {
        $this->requireGenerateAccess($request);

        $year      = (int) ($request->get('year') ?: now()->year);
        $rawMonth  = $request->get('month');
        $month     = ($rawMonth !== null && $rawMonth !== '') ? (int) $rawMonth : now()->month;
        $month     = max(1, min(12, $month)); // clamp to valid range
        $branchId  = $request->get('branch_id');
        $role      = $request->user()?->getRoleNames()->first();

        $monthNames = $this->monthNames();

        $query = BirTransaction::with(['branch'])
            ->forYear($year)
            ->forMonth($month)
            ->whereIn('document_type', ['AR', 'SI'])  // BIR-relevant docs only
            ->orderBy('transaction_date')
            ->orderBy('document_number');

        // Branch scoping: president, finance_admin_supervisor, administrative_assistant, etc. can pass branch_id;
        // everyone else is always scoped to their own branch.
        if (! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'general_sales_manager', 'accounting_assistant'], true)) {
            $query->forBranch($request->user()->branch_id);
            $branchName = $request->user()->branch?->name ?? 'Branch';
        } elseif ($branchId) {
            $query->forBranch((int) $branchId);
            $branchName = \App\Models\Branch::find($branchId)?->name ?? 'Branch';
        } else {
            $branchName = 'All Branches';
        }

        $transactions = $query->get();

        if ($transactions->isEmpty()) {
            return redirect()->route('bir.index', array_filter([
                'year'  => $year,
                'month' => $month,
            ]))->with('flash', [
                'type'    => 'warning',
                'message' => "No BIR transactions found for {$monthNames[$month - 1]} {$year}.",
            ]);
        }

        $filename = sprintf(
            'BIR-Monthly-%s-%02d-%s.xlsx',
            $year,
            $month,
            now()->format('Ymd-His'),
        );

        return Excel::download(
            new BirMonthlyExport($transactions, $year, $month, $branchName),
            $filename,
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private function monthNames(): array
    {
        return ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
    }

    private function requireViewAccess(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::VIEW_ROLES, true)) {
            abort(403, 'You do not have access to BIR / Compliance records.');
        }
    }

    private function requireGenerateAccess(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::GENERATE_ROLES, true)) {
            abort(403, 'Only Accounting can create or export BIR documents.');
        }
    }

    // Audit access = generate roles + administrative_assistant (audit remarks only)
    private function requireAuditAccess(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first(), self::AUDIT_ROLES, true)) {
            abort(403, 'You do not have permission to update BIR records.');
        }
    }

    private function canGenerate(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::GENERATE_ROLES, true);
    }
}