<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * Usage in routes:
     *   ->middleware('role:president')
     *   ->middleware('role:accounting_assistant|finance_admin_supervisor')
     *
     * Valid roles (sourced from Roles & Permissions Matrix):
     *   president
     *   chief_operating_officer
     *   finance_admin_supervisor
     *   administrative_assistant
     *   accounting_assistant
     *   liaison_officer_finance
     *   general_sales_manager
     *   sales_reservation_officer
     *   sales_ticketing_officer
     *   group_sales_officer
     *   business_development_manager
     *   sales_marketing_officer
     *   visa_documentation_supervisor
     *   liaison_officer_visa
     *   visa_documentation_officer
     *   branch_supervisor
     *   branch_sales_officer
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return redirect()->route('auth.login');
        }

        foreach ($roles as $role) {
            if ($request->user()->hasRole($role)) {
                return $next($request);
            }
        }

        // Return Inertia 403 page — not a raw HTTP 403
        return inertia('Errors/403')->toResponse($request)->setStatusCode(403);
    }
}
