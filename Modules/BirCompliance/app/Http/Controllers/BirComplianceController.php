<?php

namespace Modules\BirCompliance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BirCompliance\Http\Requests\StoreBirTransactionRequest;
use Modules\BirCompliance\Models\BirTransaction;

class BirComplianceController extends Controller
{
    // From Roles.md: view = disbursement_officer, accounting_officer, admin_auditor, general_manager
    // Generate = disbursement_officer, accounting_officer
    private const VIEW_ROLES = [
        'disbursement_officer',
        'accounting_officer',
        'admin_auditor',
        'general_manager',
    ];

    private const GENERATE_ROLES = [
        'disbursement_officer',
        'accounting_officer',
    ];

    // ════════════════════════════════════════════════════════════════════════
    // INDEX
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $this->requireViewAccess($request);

        $year   = (int) $request->get('year', now()->year);
        $month  = $request->get('month');
        $type   = $request->get('document_type');
        $search = $request->get('search');
        $branch = $request->get('branch_id');

        $role = $request->user()?->getRoleNames()->first();

        $query = BirTransaction::with(['branch', 'createdBy'])
            ->forYear($year)
            ->forMonth($month ? (int)$month : null)
            ->forDocumentType($type)
            ->search($search)
            ->latest('transaction_date');

        if (! in_array($role, ['general_manager', 'admin_auditor'], true)) {
            $query->forBranch($request->user()->branch_id);
        } elseif ($branch) {
            $query->forBranch((int) $branch);
        }

        $transactions = $query->paginate(25)->withQueryString();

        $monthlySummary = BirTransaction::forYear($year)
            ->when(! in_array($role, ['general_manager', 'admin_auditor'], true), function ($q) use ($request) {
                $q->forBranch($request->user()->branch_id);
            })
            ->selectRaw("month, document_type, COUNT(*) as count,
                SUM(gross_amount) as total_gross, SUM(vat_amount) as total_vat,
                SUM(net_amount_due) as total_net")
            ->groupByRaw('month, document_type')
            ->orderBy('month')
            ->get();

        $totals = BirTransaction::forYear($year)
            ->forMonth($month ? (int)$month : null)
            ->forDocumentType($type)
            ->when(! in_array($role, ['general_manager', 'admin_auditor'], true), function ($q) use ($request) {
                $q->forBranch($request->user()->branch_id);
            })
            ->selectRaw("COUNT(*) as total_count,
                SUM(gross_amount) as total_gross, SUM(vatable_sales) as total_vatable,
                SUM(vat_exempt_sales) as total_exempt, SUM(vat_zero_rated_sales) as total_zero_rated,
                SUM(vat_amount) as total_vat, SUM(withholding_tax) as total_wht,
                SUM(net_amount_due) as total_net")
            ->first();

        return Inertia::render('BirCompliance/Index', [
            'transactions'   => $transactions,
            'monthlySummary' => $monthlySummary,
            'totals'         => $totals,
            'filters'        => compact('year', 'month', 'type', 'search', 'branch'),
            'documentTypes'  => BirTransaction::DOCUMENT_TYPES,
            'months'         => $this->monthNames(),
            'currentYear'    => now()->year,
            'years'          => range(now()->year, now()->year - 5),
            'canGenerate'    => $this->canGenerate($request),
        ]);
    }

    public function show(Request $request, BirTransaction $birTransaction): Response
    {
        $this->requireViewAccess($request);
        $birTransaction->load(['branch', 'createdBy', 'updatedBy']);

        return Inertia::render('BirCompliance/Show', [
            'transaction'   => $birTransaction,
            'documentTypes' => BirTransaction::DOCUMENT_TYPES,
            'sourceTypes'   => BirTransaction::SOURCE_TYPES,
            'paymentModes'  => BirTransaction::PAYMENT_MODES,
            'canGenerate'   => $this->canGenerate($request),
            'atpNumber'     => BirTransaction::BIR_ATP_NUMBER,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireGenerateAccess($request);

        return Inertia::render('BirCompliance/Create', [
            'documentTypes' => BirTransaction::DOCUMENT_TYPES,
            'sourceTypes'   => BirTransaction::SOURCE_TYPES,
            'paymentModes'  => BirTransaction::PAYMENT_MODES,
            'vatRate'       => BirTransaction::VAT_RATE,
            'whtRate'       => BirTransaction::WHT_RATE,
            'atpNumber'     => BirTransaction::BIR_ATP_NUMBER,
            'months'        => $this->monthNames(),
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

        $txDate = \Carbon\Carbon::parse($data['transaction_date']);
        $data['year']  = $txDate->year;
        $data['month'] = $txDate->month;

        $vatBreakdown = BirTransaction::computeVatBreakdown(
            grossAmount:    (float) $data['gross_amount'],
            vatExempt:      (bool)  ($data['is_vat_exempt'] ?? false),
            vatZeroRated:   (bool)  ($data['is_vat_zero_rated'] ?? false),
            scPwdDiscount:  (float) ($data['sc_pwd_discount'] ?? 0),
            withholdingTax: (float) ($data['withholding_tax'] ?? 0)
        );

        $data = array_merge($data, $vatBreakdown);
        unset($data['is_vat_exempt'], $data['is_vat_zero_rated']);

        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id']  = $request->user()->branch_id;
        $data['branch_code']= $request->user()->branch?->code ?? null;

        $tx = BirTransaction::create($data);

        return redirect()
            ->route('bir.show', $tx)
            ->with('flash', ['type' => 'success', 'message' => "BIR transaction {$tx->document_number} created."]);
    }

    public function edit(Request $request, BirTransaction $birTransaction): Response
    {
        $this->requireGenerateAccess($request);

        return Inertia::render('BirCompliance/Edit', [
            'transaction'   => $birTransaction,
            'documentTypes' => BirTransaction::DOCUMENT_TYPES,
            'sourceTypes'   => BirTransaction::SOURCE_TYPES,
            'paymentModes'  => BirTransaction::PAYMENT_MODES,
            'vatRate'       => BirTransaction::VAT_RATE,
            'whtRate'       => BirTransaction::WHT_RATE,
            'atpNumber'     => BirTransaction::BIR_ATP_NUMBER,
            'months'        => $this->monthNames(),
        ]);
    }

    public function update(StoreBirTransactionRequest $request, BirTransaction $birTransaction): RedirectResponse
    {
        $this->requireGenerateAccess($request);

        $data = $request->validated();

        $txDate = \Carbon\Carbon::parse($data['transaction_date']);
        $data['year']  = $txDate->year;
        $data['month'] = $txDate->month;

        $vatBreakdown = BirTransaction::computeVatBreakdown(
            grossAmount:    (float) $data['gross_amount'],
            vatExempt:      (bool)  ($data['is_vat_exempt'] ?? false),
            vatZeroRated:   (bool)  ($data['is_vat_zero_rated'] ?? false),
            scPwdDiscount:  (float) ($data['sc_pwd_discount'] ?? 0),
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
            ->route('bir.show', $birTransaction)
            ->with('flash', ['type' => 'success', 'message' => 'Transaction updated.']);
    }

    public function destroy(Request $request, BirTransaction $birTransaction): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, ['general_manager', 'disbursement_officer'], true)) {
            abort(403);
        }

        $birTransaction->delete();

        return redirect()
            ->route('bir.index')
            ->with('flash', ['type' => 'success', 'message' => 'Transaction removed.']);
    }

    public function exportMonthly(Request $request): RedirectResponse
    {
        $this->requireGenerateAccess($request);
        $year  = $request->get('year',  now()->year);
        $month = $request->get('month', now()->month);

        // Full Excel export wired in Phase 12
        return back()->with('flash', [
            'type'    => 'info',
            'message' => "Monthly BIR report for {$this->monthNames()[(int)$month - 1]} {$year} — Excel export wired in Phase 12.",
        ]);
    }

    private function monthNames(): array
    {
        return ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
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
            abort(403, 'Only the Disbursement Officer or Accounting Officer can generate BIR documents.');
        }
    }

    private function canGenerate(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::GENERATE_ROLES, true);
    }
}
