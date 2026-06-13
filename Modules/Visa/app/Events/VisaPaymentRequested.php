<?php

namespace Modules\Visa\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Visa\Models\VisaApplication;

class VisaPaymentRequested
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly VisaApplication $application,
    ) {}
}
