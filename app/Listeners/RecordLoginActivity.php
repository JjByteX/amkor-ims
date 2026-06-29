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
    /**
     * Prevents duplicate entries when the listener fires more than once
     * per event dispatch (e.g. double-registration via the module system).
     * Static so it resets naturally per PHP-FPM request lifecycle.
     *
     * @var array<string, true>
     */
    private static array $recorded = [];

    public function handle(Login|Logout $event): void
    {
        if (! class_exists(\Spatie\Activitylog\Models\Activity::class)) {
            return;
        }

        $user = $event->user ?? null;
        if (! $user) return;

        $type = $event instanceof Login ? 'login' : 'logout';
        $key  = $type . ':' . $user->getAuthIdentifier();

        // Skip if this user + event type was already recorded in this request.
        if (isset(self::$recorded[$key])) {
            return;
        }
        self::$recorded[$key] = true;

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
