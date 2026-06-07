<?php

namespace Modules\OrmocBranch\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class OrmocBranchServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'OrmocBranch';

    protected string $nameLower = 'ormocbranch';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    /**
     * No scheduled commands in Phase 5.
     *
     * Phase 12 activates:
     *   - International escalation email (already wired via route action in OrmocBranchController@escalate)
     *   - Real Gmail SMTP tested end-to-end
     *
     * The escalation mail (OrmocEscalationMail) is already queued via Mail::queue() in the
     * controller — no scheduler needed. It fires on-demand when the Escalate action is triggered.
     */
}
