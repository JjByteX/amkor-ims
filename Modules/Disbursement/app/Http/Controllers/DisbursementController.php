<?php

namespace Modules\Disbursement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Disbursement\Http\Requests\StoreVoucherRequest;
use Modules\Disbursement\Http\Requests\StoreDisbursementEntryRequest;
use Modules\Disbursement\Models\DisbursementEntry;
use Modules\Disbursement\Models\Voucher;

class DisbursementController extends Controller
{
    // ─── Roles ─────────────────────────────────────────────────────────────

    private const PREPARER_ROLES = [
        'disbursement_officer',
        'accounting_officer',
    ];

    private const CHECKER_ROLES = [
        'admin_auditor',
        'general_manager',
    ];

    private const APPROVER_ROLES = [
        'general_manager',
    ];

    private const VIEW_ROLES = [
        'disbursement_officer',
        'accounting_officer',
        'admin_auditor',
        'general_manager',
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

        $search   = $request->get('search');
        $type     = $request->get('type');
        $approval = $request->get('approval_status');
        $month    = $request->get('month');

        $query = Voucher::with(['branch', 'createdBy', 'checker', 'approver'])
            ->latest('date');

        // Disbursement officer sees own branch records; GM/Auditor see all
        if (! in_array($role, ['general_manager', 'admin_auditor'], true)) {
            $query->forBranch($request->user()->branch_id);
        }

        $query->search($search)
              ->forType($type)
              ->forApprovalStatus($approval);

        if ($month) {
            [$y, $m] = explode('-', $month . '-01');
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
            'vouchers'         => $vouchers,
            'summary'          => $summary,
            'filters'          => compact('search', 'type', 'approval', 'month'),
            'types'            => Voucher::TYPES,
            'approvalStatuses' => Voucher::APPROVAL_STATUSES,
            'canWrite'         => $this->canPrepare($request),
            'canCheck'         => $this->canCheck($request),
            'canApprove'       => $this->canApprove($request),
        ]);
    }

    public function voucherCreate(Request $request): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('Disbursement/VoucherCreate', [
            'types'     => Voucher::TYPES,
            'currencies'=> Voucher::CURRENCIES,
        ]);
    }

    public function voucherStore(StoreVoucherRequest $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validated();
        $data['voucher_no'] = Voucher::nextNumber($data['type']);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id']  = $request->user()->branch_id;

        $voucher = Voucher::create($data);

        // Automatically create a disbursement entry when voucher is approved
        // (entry will be created in the approve action)

        return redirect()
            ->route('disbursement.vouchers.show', $voucher)
            ->with('flash', ['type' => 'success', 'message' => "Voucher {$voucher->voucher_no} created."]);
    }

    public function voucherShow(Request $request, Voucher $voucher): Response
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $voucher->load(['branch', 'createdBy', 'updatedBy', 'checker', 'approver', 'releaser', 'disbursementEntries']);

        return Inertia::render('Disbursement/VoucherShow', [
            'voucher'          => $voucher,
            'types'            => Voucher::TYPES,
            'approvalStatuses' => Voucher::APPROVAL_STATUSES,
            'currencies'       => Voucher::CURRENCIES,
            'canWrite'         => $this->canPrepare($request),
            'canCheck'         => $this->canCheck($request),
            'canApprove'       => $this->canApprove($request),
        ]);
    }

    public function voucherEdit(Request $request, Voucher $voucher): Response
    {
        $this->requirePreparer($request);

        if ($voucher->isApproved()) {
            return redirect()->route('disbursement.vouchers.show', $voucher)
                ->with('flash', ['type' => 'warning', 'message' => 'Voucher is approved and locked.']);
        }

        return Inertia::render('Disbursement/VoucherEdit', [
            'voucher'    => $voucher,
            'types'      => Voucher::TYPES,
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
            ->route('disbursement.vouchers.show', $voucher)
            ->with('flash', ['type' => 'success', 'message' => 'Voucher updated.']);
    }

    public function voucherDestroy(Request $request, Voucher $voucher): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['general_manager', 'disbursement_officer'], true)) {
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
            'checked_by'      => $request->user()->id,
            'checked_at'      => now(),
            'approval_status' => 'checked',
            'updated_by'      => $request->user()->id,
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
            'approved_by'     => $request->user()->id,
            'approved_at'     => now(),
            'approval_status' => 'approved',
            'updated_by'      => $request->user()->id,
        ]);

        // Auto-create disbursement entry upon approval
        DisbursementEntry::create([
            'date'         => $voucher->date,
            'category'     => $voucher->type, // 'cash' or 'check'
            'reference_no' => $voucher->voucher_no,
            'voucher_id'   => $voucher->id,
            'payee'        => $voucher->payee,
            'description'  => $voucher->details,
            'account_code' => $voucher->account_code,
            'currency'     => $voucher->currency,
            'amount'       => $voucher->amount,
            'fund_type'    => $voucher->type === 'check' ? 'cash_on_bank' : 'cash_on_hand',
            'branch_id'    => $voucher->branch_id,
            'created_by'   => $request->user()->id,
            'updated_by'   => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Voucher approved. Disbursement entry created.']);
    }

    public function voucherRelease(Request $request, Voucher $voucher): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, ['disbursement_officer', 'accounting_officer', 'general_manager'], true)) {
            abort(403);
        }

        if (! $voucher->approved_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Voucher must be approved before release.']);
        }

        $voucher->update([
            'released_by'     => $request->user()->id,
            'released_at'     => now(),
            'approval_status' => 'released',
            'updated_by'      => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Voucher released.']);
    }

    // ─── PDF stub ─────────────────────────────────────────────────────────

    public function voucherPdf(Request $request, Voucher $voucher): RedirectResponse
    {
        // PDF generation stub — full PDF implementation in Phase 9 via DomPDF
        $voucher->update([
            'pdf_generated'    => true,
            'pdf_generated_at' => now(),
        ]);

        return back()->with('flash', [
            'type'    => 'info',
            'message' => "PDF for {$voucher->voucher_no} will be generated in Phase 9 (Document Generation module).",
        ]);
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

        $search   = $request->get('search');
        $category = $request->get('category');
        $branch   = $request->get('branch_id');
        $month    = $request->get('month');

        $query = DisbursementEntry::with(['voucher', 'branch', 'createdBy'])
            ->latest('date');

        // Branch scoping
        if (! in_array($role, ['general_manager', 'admin_auditor', 'accounting_officer'], true)) {
            $query->forBranch($request->user()->branch_id);
        } elseif ($branch) {
            $query->forBranch((int) $branch);
        }

        $query->search($search)->forCategory($category);

        if ($month) {
            [$y, $m] = explode('-', $month . '-01');
            $query->forMonth((int) $y, (int) $m);
        }

        $entries = $query->paginate(25)->withQueryString();

        $summary = DisbursementEntry::search($search)->forCategory($category)
            ->selectRaw('
                sum(amount) as total_amount,
                count(*)    as total_count
            ')->first();

        return Inertia::render('Disbursement/LedgerIndex', [
            'entries'    => $entries,
            'summary'    => $summary,
            'filters'    => compact('search', 'category', 'branch', 'month'),
            'categories' => DisbursementEntry::CATEGORIES,
            'fundTypes'  => DisbursementEntry::FUND_TYPES,
            'canWrite'   => $this->canPrepare($request),
        ]);
    }

    public function ledgerCreate(Request $request): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('Disbursement/LedgerCreate', [
            'categories' => DisbursementEntry::CATEGORIES,
            'fundTypes'  => DisbursementEntry::FUND_TYPES,
            'currencies' => DisbursementEntry::CURRENCIES,
        ]);
    }

    public function ledgerStore(StoreDisbursementEntryRequest $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['branch_id']  = $request->user()->branch_id;

        $entry = DisbursementEntry::create($data);

        return redirect()
            ->route('disbursement.ledger.index')
            ->with('flash', ['type' => 'success', 'message' => 'Disbursement entry recorded.']);
    }

    public function ledgerEdit(Request $request, DisbursementEntry $entry): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('Disbursement/LedgerEdit', [
            'entry'      => $entry,
            'categories' => DisbursementEntry::CATEGORIES,
            'fundTypes'  => DisbursementEntry::FUND_TYPES,
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

        if (! in_array($role, ['general_manager', 'disbursement_officer'], true)) {
            abort(403);
        }

        $entry->delete();

        return redirect()
            ->route('disbursement.ledger.index')
            ->with('flash', ['type' => 'success', 'message' => 'Entry removed.']);
    }

    // ─── Access file export stub ──────────────────────────────────────────

    public function accessFileExport(Request $request): RedirectResponse
    {
        // Full export in Phase 9; stub records the period
        return back()->with('flash', [
            'type'    => 'info',
            'message' => 'Access file export will be fully implemented in Phase 9 (Document Generation module). Reminder has been noted.',
        ]);
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