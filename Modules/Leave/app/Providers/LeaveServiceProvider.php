<?php

namespace Modules\Leave\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class LeaveServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Leave';

    protected string $nameLower = 'leave';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
