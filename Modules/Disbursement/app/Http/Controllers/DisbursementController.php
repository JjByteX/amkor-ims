<?php

namespace Modules\Disbursement\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Disbursement\Exports\DisbursementAccessFileExport;
use Modules\Disbursement\Http\Requests\StoreDisbursementEntryRequest;
use Modules\Disbursement\Http\Requests\StoreVoucherRequest;
use Modules\Disbursement\Models\DisbursementEntry;
use Modules\Disbursement\Models\Voucher;

class DisbursementController extends Controller
{
    // ─── Roles ─────────────────────────────────────────────────────────────

    private const PREPARER_ROLES = [
        'accounting_assistant',
    ];

    private const CHECKER_ROLES = [
        'administrative_assistant',
        'finance_admin_supervisor',
    ];

    private const APPROVER_ROLES = [
        'president',
    ];

    private const VIEW_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'accounting_assistant',
        'liaison_officer_finance',
    ];

    // ════════════════════════════════════════════════════════════════════════
    // VOUCHERS
    // ════════════════════════════════════════════════════════════════════════

    public function vouchersIndex(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $type = $request->get('type');
        $approval = $request->get('approval_status');
        $month = $request->get('month');

        $query = Voucher::with(['branch', 'createdBy', 'checker', 'approver'])
            ->latest('date');

        // accounting_assistant sees own branch; president/finance_admin_supervisor/administrative_assistant/chief_operating_officer see all
        if (! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'accounting_assistant'], true)) {
            $query->forBranch($request->user()->branch_id);
        }

        $query->search($search)
            ->forType($type)
            ->forApprovalStatus($approval);

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $vouchers = $query->paginate(25)->withQueryString();

        $summary = Voucher::search($search)->forType($type)
            ->selectRaw('
                sum(amount) as total_amount,
                count(*) as total_count,
                sum(case when approval_status = \'pending\' then 1 else 0 end) as pending_count,
                sum(case when approval_status = \'approved\' then 1 else 0 end) as approved_count
            ')->first();

        return Inertia::render('Disbursement/VouchersIndex', [
            'vouchers' => $vouchers,
            'summary' => $summary,
            'filters' => compact('search', 'type', 'approval', 'month'),
            'types' => Voucher::TYPES,
            'approvalStatuses' => Voucher::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    public function voucherCreate(Request $request): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('Disbursement/VoucherCreate', [
            'types' => Voucher::TYPES,
            'currencies' => Voucher::CURRENCIES,
        ]);
    }

    public function voucherStore(StoreVoucherRequest $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validated();
        $data['voucher_no'] = Voucher::nextNumber($data['type']);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id;

        $voucher = Voucher::create($data);

        // Automatically create a disbursement entry when voucher is approved
        // (entry will be created in the approve action)

        return redirect()
            ->route('disbursement.vouchers.index')
            ->with('flash', ['type' => 'success', 'message' => "Voucher {$voucher->voucher_no} created."]);
    }

    public function voucherShow(Request $request, Voucher $voucher): Response|JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $voucher->load(['branch', 'createdBy', 'updatedBy', 'checker', 'approver', 'releaser', 'disbursementEntries']);

        if ($request->wantsJson() || $request->get('json')) {
            return response()->json([
            'voucher' => $voucher,
            'types' => Voucher::TYPES,
            'approvalStatuses' => Voucher::APPROVAL_STATUSES,
            'currencies' => Voucher::CURRENCIES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
        }
        return Inertia::render('Disbursement/VoucherShow', [
            'voucher' => $voucher,
            'types' => Voucher::TYPES,
            'approvalStatuses' => Voucher::APPROVAL_STATUSES,
            'currencies' => Voucher::CURRENCIES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    public function voucherEdit(Request $request, Voucher $voucher): Response
    {
        $this->requirePreparer($request);

        if ($voucher->isApproved()) {
            return redirect()->route('disbursement.vouchers.index')
                ->with('flash', ['type' => 'warning', 'message' => 'Voucher is approved and locked.']);
        }

        return Inertia::render('Disbursement/VoucherEdit', [
            'voucher' => $voucher,
            'types' => Voucher::TYPES,
            'currencies' => Voucher::CURRENCIES,
        ]);
    }

    public function voucherUpdate(StoreVoucherRequest $request, Voucher $voucher): RedirectResponse
    {
        $this->requirePreparer($request);

        if ($voucher->isApproved()) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Cannot edit an approved voucher.']);
        }

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        $voucher->update($data);

        return redirect()
            ->route('disbursement.vouchers.index')
            ->with('flash', ['type' => 'success', 'message' => 'Voucher updated.']);
    }

    public function voucherDestroy(Request $request, Voucher $voucher): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if ($role !== 'president') {
            abort(403);
        }

        $voucher->delete();

        return redirect()
            ->route('disbursement.vouchers.index')
            ->with('flash', ['type' => 'success', 'message' => 'Voucher removed.']);
    }

    // ─── Voucher Approval chain ───────────────────────────────────────────

    public function voucherCheck(Request $request, Voucher $voucher): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::CHECKER_ROLES, true)) {
            abort(403, 'Only the Admin Auditor or General Manager can check vouchers.');
        }

        if ($voucher->checked_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Voucher already checked.']);
        }

        $voucher->update([
            'checked_by' => $request->user()->id,
            'checked_at' => now(),
            'approval_status' => 'checked',
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Voucher checked. Awaiting JRT approval.']);
    }

    public function voucherApprove(Request $request, Voucher $voucher): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::APPROVER_ROLES, true)) {
            abort(403, 'Only the General Manager can approve vouchers.');
        }

        if (! $voucher->checked_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Voucher must be checked before approval.']);
        }

        if ($voucher->approved_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Voucher already approved.']);
        }

        $voucher->update([
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'approval_status' => 'approved',
            'updated_by' => $request->user()->id,
        ]);

        // Auto-create disbursement entry upon approval
        DisbursementEntry::create([
            'date' => $voucher->date,
            'category' => $voucher->type, // 'cash' or 'check'
            'reference_no' => $voucher->voucher_no,
            'voucher_id' => $voucher->id,
            'payee' => $voucher->payee,
            'description' => $voucher->details,
            'account_code' => $voucher->account_code,
            'currency' => $voucher->currency,
            'amount' => $voucher->amount,
            'fund_type' => $voucher->type === 'check' ? 'cash_on_bank' : 'cash_on_hand',
            'branch_id' => $voucher->branch_id,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Voucher approved. Disbursement entry created.']);
    }

    public function voucherRelease(Request $request, Voucher $voucher): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['accounting_assistant', 'liaison_officer_finance', 'president'], true)) {
            abort(403);
        }

        if (! $voucher->approved_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Voucher must be approved before release.']);
        }

        $voucher->update([
            'released_by' => $request->user()->id,
            'released_at' => now(),
            'approval_status' => 'released',
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Voucher released.']);
    }

    // ─── PDF generation ────────────────────────────────────────────────────
    //
    // Delegates to DocumentGeneration module routes, which use DomPDF.
    // The button in VoucherShow posts here; we redirect the browser to the
    // correct PDF endpoint as a GET so the file streams directly.
    //
    // Cash vouchers  → documents.cash-voucher
    // Check vouchers → documents.check-voucher

    public function voucherPdf(Request $request, Voucher $voucher): \Illuminate\Http\RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();
        $allowed = ['accounting_assistant', 'liaison_officer_finance', 'administrative_assistant', 'finance_admin_supervisor', 'president', 'chief_operating_officer'];

        if (! in_array($role, $allowed, true)) {
            abort(403, 'You do not have permission to generate voucher PDFs.');
        }

        $routeName = match ($voucher->type) {
            'cash'  => 'documents.cash-voucher',
            'check' => 'documents.check-voucher',
            default => null,
        };

        if (! $routeName) {
            return back()->with('flash', [
                'type'    => 'error',
                'message' => "Unknown voucher type '{$voucher->type}'. Cannot generate PDF.",
            ]);
        }

        // Redirect to the DocumentGeneration GET endpoint, which streams the PDF.
        return redirect()->to(route($routeName, $voucher->id));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DISBURSEMENT LEDGER
    // ════════════════════════════════════════════════════════════════════════

    public function ledgerIndex(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $search = $request->get('search');
        $category = $request->get('category');
        $branch = $request->get('branch_id');
        $month = $request->get('month');

        $query = DisbursementEntry::with(['voucher', 'branch', 'createdBy'])
            ->latest('date');

        // Branch scoping
        if (! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'accounting_assistant'], true)) {
            $query->forBranch($request->user()->branch_id);
        } elseif ($branch) {
            $query->forBranch((int) $branch);
        }

        $query->search($search)->forCategory($category);

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $entries = $query->paginate(25)->withQueryString();

        $summary = DisbursementEntry::search($search)->forCategory($category)
            ->selectRaw('
                sum(amount) as total_amount,
                count(*)    as total_count
            ')->first();

        return Inertia::render('Disbursement/LedgerIndex', [
            'entries' => $entries,
            'summary' => $summary,
            'filters' => compact('search', 'category', 'branch', 'month'),
            'categories' => DisbursementEntry::CATEGORIES,
            'fundTypes' => DisbursementEntry::FUND_TYPES,
            'canWrite' => $this->canPrepare($request),
        ]);
    }

    public function ledgerCreate(Request $request): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('Disbursement/LedgerCreate', [
            'categories' => DisbursementEntry::CATEGORIES,
            'fundTypes' => DisbursementEntry::FUND_TYPES,
            'currencies' => DisbursementEntry::CURRENCIES,
        ]);
    }

    public function ledgerStore(StoreDisbursementEntryRequest $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id'] = $request->user()->branch_id;

        $entry = DisbursementEntry::create($data);

        return redirect()
            ->route('disbursement.ledger.index')
            ->with('flash', ['type' => 'success', 'message' => 'Disbursement entry recorded.']);
    }

    public function ledgerEdit(Request $request, DisbursementEntry $entry): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('Disbursement/LedgerEdit', [
            'entry' => $entry,
            'categories' => DisbursementEntry::CATEGORIES,
            'fundTypes' => DisbursementEntry::FUND_TYPES,
            'currencies' => DisbursementEntry::CURRENCIES,
        ]);
    }

    public function ledgerUpdate(StoreDisbursementEntryRequest $request, DisbursementEntry $entry): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        $entry->update($data);

        return redirect()
            ->route('disbursement.ledger.index')
            ->with('flash', ['type' => 'success', 'message' => 'Entry updated.']);
    }

    public function ledgerDestroy(Request $request, DisbursementEntry $entry): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if ($role !== 'president') {
            abort(403);
        }

        $entry->delete();

        return redirect()
            ->route('disbursement.ledger.index')
            ->with('flash', ['type' => 'success', 'message' => 'Entry removed.']);
    }

    // ─── Access file export ───────────────────────────────────────────────

    /**
     * Phase 9 — Disbursement Access File Export.
     *
     * Generates the bimonthly Excel ledger that Dalle sends to the Admin Auditor
     * every 15th and end-of-month. The period is inferred from today's date:
     *
     *   - Running on or before the 15th  → 1st–15th of the current month
     *   - Running after the 15th         → 16th–EOM of the current month
     *
     * Optionally the caller can pass ?period=first_half or ?period=second_half
     * to override the auto-detection (useful for re-exports or manual runs).
     *
     * Branch scoping follows the same rule as the ledger index: disbursement
     * officers see only their own branch; GM and admin auditor see all or can
     * pass ?branch_id= to narrow.
     */
    public function accessFileExport(Request $request)
    {
        $this->requirePreparer($request);

        $role  = $request->user()?->getRoleNames()->first();
        $today = now();

        // ── Determine period ─────────────────────────────────────────────
        $periodOverride = $request->get('period'); // 'first_half' | 'second_half'

        if ($periodOverride === 'first_half' || ($periodOverride === null && $today->day <= 15)) {
            $periodStart = $today->copy()->startOfMonth();
            $periodEnd   = $today->copy()->startOfMonth()->day(15);
            $periodLabel = '1st-15th';
            $periodDate  = $periodEnd->toDateString();   // stored on entries: YYYY-MM-15
        } else {
            $periodStart = $today->copy()->startOfMonth()->day(16);
            $periodEnd   = $today->copy()->endOfMonth();
            $periodLabel = '16th-EOM';
            $periodDate  = $periodEnd->toDateString();   // stored on entries: YYYY-MM-{last}
        }

        // ── Branch scoping ───────────────────────────────────────────────
        $branchId   = null;
        $branchName = 'All Branches';

        if (! in_array($role, ['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'accounting_assistant'], true)) {
            // Liaison/finance roles are scoped to their own branch
            $branchId   = $request->user()->branch_id;
            $branchName = $request->user()->branch?->name ?? 'Branch';
        } elseif ($request->has('branch_id')) {
            $branchId   = (int) $request->get('branch_id');
            $branchName = Branch::find($branchId)?->name ?? 'Branch';
        }

        // ── Query ────────────────────────────────────────────────────────
        $query = DisbursementEntry::with(['branch', 'createdBy', 'voucher'])
            ->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->orderBy('date')
            ->orderBy('id');

        if ($branchId) {
            $query->forBranch($branchId);
        }

        $entries = $query->get();

        // ── Empty guard ──────────────────────────────────────────────────
        if ($entries->isEmpty()) {
            return back()->with('flash', [
                'type'    => 'warning',
                'message' => "No disbursement entries found for the {$periodLabel} period of {$today->format('F Y')}.",
            ]);
        }

        // ── Stamp entries with access_file_period (first export only) ────
        // This marks the batch so it is visible in the ledger after export.
        DisbursementEntry::whereIn('id', $entries->pluck('id'))
            ->whereNull('access_file_period')
            ->update(['access_file_period' => $periodDate]);

        // ── Download ─────────────────────────────────────────────────────
        $filename = sprintf(
            'Disbursement-AccessFile-%s-%s-%s.xlsx',
            $today->format('Y'),
            $today->format('m'),
            $periodLabel,
        );

        return Excel::download(
            new DisbursementAccessFileExport(
                entries:     $entries,
                periodLabel: $periodLabel,
                periodDate:  $periodDate,
                branchName:  $branchName,
                monthYear:   $today->format('F Y'),
            ),
            $filename,
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private function canPrepare(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::PREPARER_ROLES,
            true
        );
    }

    private function canCheck(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::CHECKER_ROLES,
            true
        );
    }

    private function canApprove(Request $request): bool
    {
        return in_array(
            $request->user()?->getRoleNames()->first() ?? '',
            self::APPROVER_ROLES,
            true
        );
    }

    private function requirePreparer(Request $request): void
    {
        if (! $this->canPrepare($request)) {
            abort(403, 'You do not have permission to manage disbursement records.');
        }
    }
}
