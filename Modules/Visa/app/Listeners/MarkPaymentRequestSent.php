<?php

namespace Modules\Visa\Listeners;

use Modules\Visa\Events\VisaPaymentRequested;

/**
 * Stub listener on the Visa side — currently a no-op.
 *
 * The real work (creating the AP Payable) is done by
 * Modules\AccountsPayable\Listeners\CreatePayableFromVisaPaymentRequest,
 * which is registered in the AP module's EventServiceProvider and also
 * listens to VisaPaymentRequested.
 *
 * This class exists so the Visa ESP registration is self-contained and
 * so you have a place to add Visa-side side-effects in future phases
 * (e.g. logging, status flags) without touching the AP module.
 */
class MarkPaymentRequestSent
{
    public function handle(VisaPaymentRequested $event): void
    {
        // No-op — visa record is already updated in the controller
        // before this event is dispatched.
    }
}
