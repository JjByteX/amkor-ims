<?php

namespace App\Events;

use App\Support\DashboardCollector;

class DashboardSummaryRequested
{
    public function __construct(public DashboardCollector $collector) {}
}
