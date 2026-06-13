<?php

namespace App\Http\Controllers;

use App\Events\DashboardSummaryRequested;
use App\Support\DashboardCollector;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        // ── Dashboard section data ─────────────────────────────────────────
        $collector = new DashboardCollector($user);
        event(new DashboardSummaryRequested($collector));

        // ── Login activity (last 8 events for the panel) ──────────────────
        $loginActivity = [];

        if (class_exists(\Spatie\Activitylog\Models\Activity::class)) {
            $loginActivity = \Spatie\Activitylog\Models\Activity::query()
                ->where('causer_type', get_class($user))
                ->where('causer_id', $user->id)
                ->whereIn('event', ['login', 'logout', 'time_in', 'time_out'])
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn ($a) => [
                    'type'  => $a->event,
                    'label' => match ($a->event) {
                        'login'    => 'Logged In',
                        'logout'   => 'Logged Out',
                        'time_in'  => 'Clocked In',
                        'time_out' => 'Clocked Out',
                        default    => ucfirst($a->event),
                    },
                    'at' => $a->created_at->toIso8601String(),
                ])
                ->values()
                ->all();
        }

        return Inertia::render('Dashboard', [
            'dashboardSections' => $collector->toArray(),
            'loginActivity'     => $loginActivity,
        ]);
    }
}
