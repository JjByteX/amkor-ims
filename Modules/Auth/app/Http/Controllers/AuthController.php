<?php

namespace Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Auth\Http\Requests\LoginRequest;

class AuthController extends Controller
{
    /**
     * Show the login page.
     */
    public function showLogin(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            // Surface the session-timeout flag set by the session middleware
            'timedOut' => $request->session()->pull('timed_out', false),
        ]);
    }

    /**
     * Handle a login attempt.
     */
    public function login(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Extend session lifetime to 120 minutes on successful login
        config(['session.lifetime' => 120]);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy the authenticated session.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
