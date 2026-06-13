<?php

namespace Modules\Visa\Listeners;

use Modules\AccountsPayable\Events\PayableReleased;
use Modules\Visa\Models\VisaApplication;

/**
 * Syncs `cv_number` and `date_requested` on the originating VisaApplication
 * when its auto-created AP Payable is released to the operator/embassy.
 *
 * Excel source: "For Collection" / "Expo" sheets — the "CV No." and
 * "Date Requested" columns record which Cash/Check Voucher was used to pay
 * the operator and when that request was sent. Previously these were typed
 * by hand; now they are derived from the Payable's linked Voucher (or its
 * check number) and release date.
 *
 * Trigger : PayableReleased (fired by AccountsPayableController::release)
 * Guard   : only acts when the Payable has `visa_application_id` set, i.e.
 *           it was auto-created by CreatePayableFromVisaPaymentRequest.
 */
class SyncCvNumberOnPayableRelease
{
    public function handle(PayableReleased $event): void
    {
        $payable = $event->payable;

        if (! $payable->visa_application_id) {
            return;
        }

        $visa = VisaApplication::find($payable->visa_application_id);

        if (! $visa) {
            return;
        }

        // CV number resolution: linked Voucher's number first, then check no.
        $cvNumber = $payable->voucher?->voucher_no ?? $payable->check_no;

        $visa->update([
            'cv_number' => $cvNumber ?? $visa->cv_number,
            'date_requested' => $payable->payment_date
                ?? $payable->released_at?->toDateString()
                ?? $visa->date_requested,
        ]);
    }
}
