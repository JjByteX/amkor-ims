<?php

namespace App\Http\Middleware;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     * Available on every page via usePage().props
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // ── Gap 8 — Global branch context ─────────────────────────────────
        //
        // Four all-access roles (president, COO, finance_admin_supervisor,
        // administrative_assistant) can switch their active branch via a pill
        // in the sidebar ProfileMenu. The chosen branch is stored server-side
        // in the session as active_branch_id so it persists across navigation.
        //
        // Everyone else is hard-scoped to their own branch_id — activeBranch
        // just reflects their own branch, and branches is null (no switcher).
        //
        // Controllers read session('active_branch_id') to scope their queries;
        // a URL param (branch_id) can still override it for edge cases.
        $activeBranch = null;
        $branches     = null;

        if ($user) {
            $role = $user->getRoleNames()->first();
            $allAccessRoles = [
                'president',
                'chief_operating_officer',
                'finance_admin_supervisor',
                'administrative_assistant',
            ];

            if (in_array($role, $allAccessRoles, true)) {
                // Load the list of active branches once per request (cached by
                // query cache or just the single cheap SELECT — two rows only).
                $branchList = Branch::active()->orderBy('name')->get(['id', 'name', 'code']);

                // Determine active branch from session; fall back to QC Main
                // (the first branch alphabetically, which will be QC Main).
                $activeBranchId = $request->session()->get(
                    'active_branch_id',
                    $branchList->first()?->id
                );

                $activeBranch = $branchList->firstWhere('id', $activeBranchId)
                    ?->only(['id', 'name', 'code']);

                $branches = $branchList->map->only(['id', 'name', 'code'])->values();
            } else {
                // Scoped roles: activeBranch reflects their own branch — no
                // switcher shown; branches stays null so the UI hides the pill.
                $activeBranch = $user->branch
                    ? ['id' => $user->branch_id, 'name' => $user->branch->name, 'code' => $user->branch->code]
                    : null;
            }
        }
        // ──────────────────────────────────────────────────────────────────

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->getRoleNames()->first(),
                    'branch_id' => $user->branch_id,
                    'branch_name' => fn () => $user->branch?->name,
                    'branch_code' => fn () => $user->branch?->code,
                    'must_change_password' => $user->must_change_password,
                    'permissions' => $user->getPermissionNames(),
                ] : null,
                'unread_notifications' => fn () => $user
                    ? $user->unreadNotifications()->whereNull('archived_at')->count()
                    : 0,
            ],

            // Gap 8 — branch switcher props
            'activeBranch' => $activeBranch,
            'branches'     => $branches,

            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],

            // Flash messages — used by Toast component
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
                'type' => fn () => $request->session()->get('flash.type'),
                'message' => fn () => $request->session()->get('flash.message'),
            ],
        ];
    }
}
