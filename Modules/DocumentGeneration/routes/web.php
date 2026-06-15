<?php

use Illuminate\Support\Facades\Route;
use Modules\DocumentGeneration\Http\Controllers\DocumentGenerationController;

/*
|--------------------------------------------------------------------------
| Document Generation Module Routes
|--------------------------------------------------------------------------
|
| All PDF routes are GET requests that stream the PDF directly to the browser.
|
| BIR documents (AR, SI, SOA) reference BirTransaction records.
| Voucher documents (CV, Check Voucher) reference Disbursement Voucher records.
| Quotation references a ReservationBooking record directly.
|
| Route naming convention: documents.{type}
|
| Render methods:
|   AR, SI, CV, Check Voucher — pdftk AcroForm template fill
|   SOA                       — Blade → wkhtmltopdf (dynamic line items, Gap #6)
|   Quotation                 — Blade → wkhtmltopdf (Gap #5)
|
*/

Route::middleware(['auth'])->group(function () {

    // ── BIR / Compliance documents ────────────────────────────────────────
    Route::get('documents/ar/{birTransaction}',
        [DocumentGenerationController::class, 'generateAr'])
        ->name('documents.ar');

    Route::get('documents/si/{birTransaction}',
        [DocumentGenerationController::class, 'generateSi'])
        ->name('documents.si');

    Route::get('documents/soa/{birTransaction}',
        [DocumentGenerationController::class, 'generateSoa'])
        ->name('documents.soa');

    // ── Voucher documents ─────────────────────────────────────────────────
    Route::get('documents/cash-voucher/{voucher}',
        [DocumentGenerationController::class, 'generateCashVoucher'])
        ->name('documents.cash-voucher');

    Route::get('documents/check-voucher/{voucher}',
        [DocumentGenerationController::class, 'generateCheckVoucher'])
        ->name('documents.check-voucher');

    // ── Quotation (Gap #5) ────────────────────────────────────────────────
    // Generated from a ReservationBooking at any status (inquiry → confirmed).
    // URL: /documents/quotation/{bookingId}
    Route::get('documents/quotation/{booking}',
        [DocumentGenerationController::class, 'generateQuotation'])
        ->name('documents.quotation');
});
