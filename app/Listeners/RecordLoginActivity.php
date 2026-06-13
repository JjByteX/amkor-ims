<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

/**
 * RecordLoginActivity
 * ─────────────────────────────────────────────────────────────────────────────
 * Writes login / logout events to spatie/laravel-activitylog.
 * DashboardController reads these for the Profile panel's activity feed.
 *
 * Registered in AppServiceProvider::boot().
 * ─────────────────────────────────────────────────────────────────────────────
 */
class RecordLoginActivity
{
    public function handle(Login|Logout $event): void
    {
        if (! class_exists(\Spatie\Activitylog\Models\Activity::class)) {
            return;
        }

        $user = $event->user ?? null;
        if (! $user) return;

        $type = $event instanceof Login ? 'login' : 'logout';

        activity()
            ->causedBy($user)
            ->event($type)
            ->withProperties([
                'ip'         => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log($type === 'login' ? 'User logged in' : 'User logged out');
    }
}
