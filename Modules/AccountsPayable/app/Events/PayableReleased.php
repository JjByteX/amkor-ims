<?php

namespace Modules\AccountsPayable\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\AccountsPayable\Models\Payable;

/**
 * Fired after AccountsPayableController::release() marks a Payable as
 * released/filed.
 *
 * Consumed by the Visa module (Modules\Visa\Listeners\SyncCvNumberOnPayableRelease)
 * to write the CV number and "date requested" back onto the originating
 * VisaApplication, when the Payable was auto-created from a visa payment
 * request (`visa_application_id` is set).
 */
class PayableReleased
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Payable $payable,
    ) {}
}
