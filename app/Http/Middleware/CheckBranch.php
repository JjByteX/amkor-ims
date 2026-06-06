<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBranch
{
    /**
     * Enforce branch-scoped data access.
     *
     * Usage in routes: ->middleware('branch:ormoc')
     * Accepted branch codes: QC_MAIN, VISA_CENTRE, ORMOC
     *
     * Roles that bypass branch filtering (they see all branches):
     *   general_manager, chief_operations_officer, general_sales_manager,
     *   accounting_officer, disbursement_officer, admin_auditor, hr_admin_officer
     *
     * Roles that are branch-scoped:
     *   ormoc_branch_officer  → must be on branch ORMOC
     *   visa_documentation_officer → must be on branch VISA_CENTRE
     *   resa_officer          → must be on branch QC_MAIN
     *
     * The middleware checks that the authenticated user's branch_code matches
     * the required branch code(s) passed as arguments, unless the user has
     * an all-branch role.
     */

    /**
     * All-branch roles — bypass branch restriction entirely.
     */
    protected array $allBranchRoles = [
        'general_manager',
        'chief_operations_officer',
        'general_sales_manager',
        'accounting_officer',
        'disbursement_officer',
        'admin_auditor',
        'hr_admin_officer',
    ];

    /**
     * Handle an incoming request.
     *
     * @param string ...$branches  Branch code(s) that are allowed (e.g. 'ORMOC', 'QC_MAIN')
     */
    public function handle(Request $request, Closure $next, string ...$branches): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('auth.login');
        }

        // All-branch roles are never restricted
        foreach ($this->allBranchRoles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        // Branch-scoped: user's branch code must be in the allowed list
        $userBranchCode = $user->branch?->code;

        if ($userBranchCode && in_array($userBranchCode, $branches, true)) {
            return $next($request);
        }

        // Branch mismatch → 403
        return Inertia::render('Errors/403')
            ->toResponse($request)
            ->setStatusCode(403);
    }
}
