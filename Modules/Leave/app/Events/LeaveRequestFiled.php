<?php

namespace Modules\Leave\Events;

use Modules\Leave\Models\LeaveRequest;

class LeaveRequestFiled
{
    public function __construct(public readonly LeaveRequest $leaveRequest) {}
}
