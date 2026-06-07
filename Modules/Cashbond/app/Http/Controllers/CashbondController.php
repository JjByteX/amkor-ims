<?php

namespace Modules\Cashbond\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cashbond\Models\CashbondPortal;
use Modules\Cashbond\Models\CashbondReload;
use Modules\Notifications\Services\NotificationDispatcher;

class CashbondController extends Controller
{
    // ─── Roles ──────────────────────────────────────────────────────────────

    private const PREPARER_ROLES = ['disbursement_officer'];

    private const CHECKER_ROLES = ['admin_auditor', 'general_manager'];

    private const APPROVER_ROLES = ['general_manager'];

    private const VIEW_ROLES = ['disbursement_officer', 'admin_auditor', 'general_manager'];

    // ════════════════════════════════════════════════════════════════════════
    // PORTALS DASHBOARD
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $portals = CashbondPortal::active()
            ->withCount('reloads')
            ->with(['reloads' => fn ($q) => $q->latest()->limit(1)])
            ->get();

        $pendingReloads = CashbondReload::with(['portal', 'createdBy'])
            ->where('approval_status', '!=', 'released')
            ->latest()
            ->get();

        return Inertia::render('Cashbond/Index', [
            'portals' => $portals,
            'pendingReloads' => $pendingReloads,
            'approvalStatuses' => CashbondReload::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PORTAL SETTINGS (maintaining balance threshold)
    // ════════════════════════════════════════════════════════════════════════

    public function updatePortal(Request $request, CashbondPortal $portal): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validate([
            'maintaining_balance' => ['nullable', 'numeric', 'min:0'],
            'current_balance' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['updated_by'] = $request->user()->id;
        $portal->update($data);

        return back()->with('flash', ['type' => 'success', 'message' => "Portal \"{$portal->name}\" updated."]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // RELOAD REQUESTS
    // ════════════════════════════════════════════════════════════════════════

    public function reloadsIndex(Request $request): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $portalId = $request->get('portal_id');
        $approval = $request->get('approval_status');
        $month = $request->get('month');

        $query = CashbondReload::with(['portal', 'createdBy', 'checker', 'approver'])
            ->latest('request_date');

        $query->forPortal($portalId)->forApprovalStatus($approval);

        if ($month) {
            [$y, $m] = explode('-', $month.'-01');
            $query->whereYear('request_date', (int) $y)->whereMonth('request_date', (int) $m);
        }

        $reloads = $query->paginate(25)->withQueryString();
        $portals = CashbondPortal::active()->get(['id', 'name']);

        return Inertia::render('Cashbond/Reloads', [
            'reloads' => $reloads,
            'portals' => $portals,
            'filters' => compact('portalId', 'approval', 'month'),
            'approvalStatuses' => CashbondReload::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    public function reloadCreate(Request $request): Response
    {
        $this->requirePreparer($request);

        return Inertia::render('Cashbond/ReloadCreate', [
            'portals' => CashbondPortal::active()->get(['id', 'name', 'current_balance', 'maintaining_balance']),
        ]);
    }

    public function reloadStore(Request $request): RedirectResponse
    {
        $this->requirePreparer($request);

        $data = $request->validate([
            'portal_id' => ['required', 'exists:cashbond_portals,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'request_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        $data['reload_no'] = CashbondReload::nextNumber();
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $reload = CashbondReload::create($data);

        return redirect()
            ->route('cashbond.reloads.show', $reload)
            ->with('flash', ['type' => 'success', 'message' => "Reload request {$reload->reload_no} created."]);
    }

    public function reloadShow(Request $request, CashbondReload $reload): Response
    {
        $role = $request->user()?->getRoleNames()->first();
        if (! in_array($role, self::VIEW_ROLES, true)) {
            abort(403);
        }

        $reload->load(['portal', 'createdBy', 'checker', 'approver', 'releaser', 'voucher']);

        return Inertia::render('Cashbond/ReloadShow', [
            'reload' => $reload,
            'approvalStatuses' => CashbondReload::APPROVAL_STATUSES,
            'canWrite' => $this->canPrepare($request),
            'canCheck' => $this->canCheck($request),
            'canApprove' => $this->canApprove($request),
        ]);
    }

    // ─── Approval chain ──────────────────────────────────────────────────────

    public function reloadCheck(Request $request, CashbondReload $reload): RedirectResponse
    {
        if (! $this->canCheck($request)) {
            abort(403, 'Only Admin Auditor or General Manager can check reload requests.');
        }
        if ($reload->checked_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already checked.']);
        }

        $request->validate(['audit_remarks' => ['nullable', 'string']]);

        $reload->update([
            'checked_by' => $request->user()->id,
            'checked_at' => now(),
            'approval_status' => 'checked',
            'audit_remarks' => $request->audit_remarks ?? $reload->audit_remarks,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Reload request checked.']);
    }

    public function reloadApprove(Request $request, CashbondReload $reload): RedirectResponse
    {
        if (! $this->canApprove($request)) {
            abort(403, 'Only the General Manager can approve reload requests.');
        }
        if (! $reload->checked_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Must be checked before approval.']);
        }
        if ($reload->approved_at) {
            return back()->with('flash', ['type' => 'warning', 'message' => 'Already approved.']);
        }

        $reload->update([
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'approval_status' => 'approved',
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Reload request approved. Ready for deposit.']);
    }

    public function reloadRelease(Request $request, CashbondReload $reload): RedirectResponse
    {
        $this->requirePreparer($request);
        if (! $reload->approved_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Must be approved before release.']);
        }

        $request->validate(['deposit_date' => ['nullable', 'date']]);

        $reload->update([
            'released_by' => $request->user()->id,
            'released_at' => now(),
            'approval_status' => 'released',
            'deposit_date' => $request->deposit_date ?? now()->toDateString(),
            'updated_by' => $request->user()->id,
        ]);

        // Update portal balance
        $reload->portal->increment('current_balance', $reload->amount);
        $reload->portal->update(['updated_by' => $request->user()->id]);
        $reload->update(['balance_updated' => true]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Deposit released. Portal balance updated.']);
    }

    public function reloadNotify(Request $request, CashbondReload $reload): RedirectResponse
    {
        $this->requirePreparer($request);
        if (! $reload->released_at) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Must be released before notifying supplier.']);
        }

        $reload->loadMissing('portal');

        app(NotificationDispatcher::class)->notifyRoles(
            ['general_manager', 'admin_auditor', 'accounting_officer'],
            'Cashbond supplier notification recorded',
            "{$reload->reload_no} for {$reload->portal?->name} has been marked as supplier-notified.",
            "/cashbond/reloads/{$reload->id}",
            'success',
            true,
        );

        $reload->update([
            'supplier_notified' => true,
            'supplier_notified_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Supplier notification sent and recorded.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function canPrepare(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::PREPARER_ROLES, true);
    }

    private function canCheck(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::CHECKER_ROLES, true);
    }

    private function canApprove(Request $request): bool
    {
        return in_array($request->user()?->getRoleNames()->first() ?? '', self::APPROVER_ROLES, true);
    }

    private function requirePreparer(Request $request): void
    {
        if (! $this->canPrepare($request)) {
            abort(403, 'Only the Disbursement Officer can manage cashbond reloads.');
        }
    }
}
