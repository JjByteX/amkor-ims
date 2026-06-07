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
        $collector = new DashboardCollector($request->user());

        event(new DashboardSummaryRequested($collector));

        return Inertia::render('Dashboard', [
            'dashboardSections' => $collector->toArray(),
        ]);
    }
}
