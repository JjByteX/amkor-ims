<?php

namespace App\Http\Middleware;

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

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user ? [
                    'id'                    => $user->id,
                    'name'                  => $user->name,
                    'email'                 => $user->email,
                    'role'                  => $user->getRoleNames()->first(),
                    'branch_id'             => $user->branch_id,
                    'branch_name'           => $user->branch?->name,
                    'branch_code'           => $user->branch?->code,
                    'must_change_password'  => $user->must_change_password,
                    'permissions'           => $user->getAllPermissions()->pluck('name'),
                ] : null,
            ],

            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],

            // Flash messages — used by Toast component
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info'    => fn () => $request->session()->get('info'),
            ],
        ];
    }
}