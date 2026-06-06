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
     * Usage in routes: ->middleware('role:general_manager')
     * Multiple roles:  ->middleware('role:general_manager|accounting_officer')
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