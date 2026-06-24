<?php

namespace Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Gap 8 — Global branch switcher + creation context.
 *
 * store()       — sets active_branch_id in session for the sidebar switcher.
 *                 Controls which branch the user is "viewing". All branch-scoped
 *                 index/show pages read this.
 *
 * setContext()  — sets create_branch_id in session. Used when a multi-branch
 *                 user clicks "New Booking" or "New Visa" etc. and needs to
 *                 explicitly confirm which branch the new record belongs to.
 *                 Controllers read session('active_branch_id') for create context
 *                 (same key — switching view also switches create context, which
 *                 is the natural behaviour: if you switched to Ormoc to create a
 *                 record, the active branch IS Ormoc).
 *
 * Only the four all-access roles may call either endpoint.
 */
class BranchSessionController extends Controller
{
    private const ALLOWED_ROLES = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
    ];

    /**
     * Set the active branch (view + create context).
     *
     * POST /session/branch
     * body: { branch_id: int }
     */
    public function store(Request $request): RedirectResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::ALLOWED_ROLES, true)) {
            abort(403, 'Branch switching is not available for your role.');
        }

        $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ]);

        $branch = Branch::active()->findOrFail($request->branch_id);

        // A single session key drives both the view scope and the create context.
        // When you switch to "Ormoc" you're saying: show me Ormoc data AND create
        // new records under Ormoc. This matches how staff actually think about it.
        $request->session()->put('active_branch_id', $branch->id);

        return back()->with('flash', [
            'type'    => 'success',
            'message' => "Switched to {$branch->name}.",
        ]);
    }

    /**
     * Return the current active branch as JSON — used by the frontend
     * to display a confirmation banner when a multi-branch user is about
     * to create a record ("You are creating this under Ormoc Branch").
     *
     * GET /session/branch
     */
    public function show(Request $request): \Illuminate\Http\JsonResponse
    {
        $role = $request->user()?->getRoleNames()->first();

        if (! in_array($role, self::ALLOWED_ROLES, true)) {
            // Single-branch users — their branch is always their own
            return response()->json([
                'branch_id'   => $request->user()?->branch_id,
                'branch_name' => $request->user()?->branch?->name,
                'branch_code' => $request->user()?->branch?->code,
                'can_switch'  => false,
            ]);
        }

        $activeBranchId = $request->session()->get('active_branch_id');
        $branch = $activeBranchId ? Branch::active()->find($activeBranchId) : Branch::active()->first();

        return response()->json([
            'branch_id'   => $branch?->id,
            'branch_name' => $branch?->name,
            'branch_code' => $branch?->code,
            'can_switch'  => true,
            'all_branches' => Branch::active()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }
}
