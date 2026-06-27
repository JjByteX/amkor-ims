<?php

namespace Modules\Overtime\Events;

use Modules\Overtime\Models\OvertimeRequest;

class OvertimeRequestFiled
{
    public function __construct(public readonly OvertimeRequest $overtimeRequest) {}
}
