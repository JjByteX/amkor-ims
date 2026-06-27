<?php

namespace Modules\Overtime\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class OvertimeServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Overtime';

    protected string $nameLower = 'overtime';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
