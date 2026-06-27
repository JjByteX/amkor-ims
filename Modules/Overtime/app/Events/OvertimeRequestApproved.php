<?php

namespace Modules\Overtime\Events;

use Modules\Overtime\Models\OvertimeRequest;

class OvertimeRequestApproved
{
    public function __construct(public readonly OvertimeRequest $overtimeRequest) {}
}
