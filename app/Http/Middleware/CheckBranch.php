<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckBranch
{
    /**
     * Enforce branch-scoped data access.
     *
     * Amkor Travel & Tours has exactly two physical branches:
     *   QC_MAIN — Head Office, Quezon City
     *             (Reservation + Visa & Documentation + Finance & Admin + Marketing)
     *   ORMOC   — Provincial branch, Ormoc City, Leyte
     *
     * Usage in routes: ->middleware('branch:ORMOC') or ->middleware('branch:QC_MAIN')
     *
     * ── All-branch roles (bypass branch filtering — see all branches) ──────
     *   president
     *   chief_operating_officer
     *   finance_admin_supervisor
     *   administrative_assistant
     *   general_sales_manager
     *   accounting_assistant
     *   business_development_manager
     *
     * ── Branch-scoped roles ───────────────────────────────────────────────
     *   sales_reservation_officer      → QC_MAIN
     *   sales_ticketing_officer        → QC_MAIN (+ escalated Ormoc records via controller)
     *   group_sales_officer            → QC_MAIN
     *   sales_marketing_officer        → QC_MAIN
     *   liaison_officer_finance        → QC_MAIN
     *   liaison_officer_visa           → QC_MAIN
     *   visa_documentation_supervisor  → QC_MAIN
     *   visa_documentation_officer     → QC_MAIN
     *   branch_supervisor              → ORMOC
     *   branch_sales_officer           → ORMOC
     */

    /**
     * Roles that bypass branch restriction entirely — they see all branches.
     */
    protected array $allBranchRoles = [
        'president',
        'chief_operating_officer',
        'finance_admin_supervisor',
        'administrative_assistant',
        'general_sales_manager',
        'accounting_assistant',
        'business_development_manager',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  string  ...$branches  Branch code(s) that are allowed (e.g. 'ORMOC', 'QC_MAIN')
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
