<?php

namespace Modules\Visa\Listeners;

use Modules\AccountsPayable\Events\PayableReceived;
use Modules\Visa\Models\VisaApplication;

/**
 * Syncs `date_received` on the originating VisaApplication when its
 * auto-created AP Payable is marked 'received' (operator/embassy confirmed
 * receipt of the CV).
 *
 * Excel source: "For Collection" / "Expo" sheets — the "Date Received"
 * column. The corresponding "Payables Status" column is NOT written here —
 * it is exposed live via VisaApplication::getPayablesStatusAttribute(),
 * which now resolves to 'Received' because Payable::STATUSES includes
 * 'received'.
 *
 * Trigger : PayableReceived (fired by AccountsPayableController::markReceived)
 * Guard   : only acts when the Payable has `visa_application_id` set, i.e.
 *           it was auto-created by CreatePayableFromVisaPaymentRequest.
 */
class SyncDateReceivedOnPayableReceived
{
    public function handle(PayableReceived $event): void
    {
        $payable = $event->payable;

        if (! $payable->visa_application_id) {
            return;
        }

        $visa = VisaApplication::find($payable->visa_application_id);

        if (! $visa) {
            return;
        }

        $visa->update([
            'date_received' => $payable->date_received ?? now()->toDateString(),
        ]);
    }
}
