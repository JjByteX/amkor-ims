<?php

namespace Modules\AccountsPayable\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\AccountsPayable\Models\Payable;

/**
 * Fired after AccountsPayableController::markReceived() marks a Payable as
 * 'received' — i.e. the operator/embassy confirmed receipt of the CV.
 *
 * Consumed by the Visa module (Modules\Visa\Listeners\SyncDateReceivedOnPayableReceived)
 * to write `date_received` back onto the originating VisaApplication, when
 * the Payable was auto-created from a visa payment request
 * (`visa_application_id` is set). The VisaApplication's `payables_status`
 * accessor reflects the new "Received" status automatically.
 */
class PayableReceived
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Payable $payable,
    ) {}
}
