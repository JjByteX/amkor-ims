<?php

use Illuminate\Support\Facades\Route;
use Modules\Visa\Http\Controllers\VisaController;

/*
|--------------------------------------------------------------------------
| Visa & Documentation Module Routes
|--------------------------------------------------------------------------
|
| Create/Update own  : visa_documentation_officer (own applications only)
| Create/Update all  : visa_documentation_supervisor (can override any officer)
| Manage all         : president, chief_operating_officer (view),
|                      accounting_assistant (payment matching / OR recording),
|                      administrative_assistant (audit remarks)
| Pay embassy        : liaison_officer_visa (physical embassy payment; records OR)
| View only          : finance_admin_supervisor, administrative_assistant,
|                      general_sales_manager, chief_operating_officer, president
| Delete             : president only
|
| The Visa & Documentation desk operates from QC Main — not a separate branch.
|
| Workflow:
|   Officer creates application → update_status →
|   request_payment (triggers accounting_assistant) →
|   liaison_officer_visa pays embassy + endorse_or →
|   accounting_assistant records OR → visa_documentation_supervisor endorses
*/

Route::middleware(['auth'])->group(function () {

    // ── Sales Report ────────────────────────────────────────────────────────
    Route::get('visa/sales-report', [VisaController::class, 'salesReport'])->name('visa.sales-report');

    // ── CRUD ───────────────────────────────────────────────────────────────
    Route::get('visa', [VisaController::class, 'index'])->name('visa.index');
    Route::get('visa/create', [VisaController::class, 'create'])->name('visa.create');
    Route::post('visa', [VisaController::class, 'store'])->name('visa.store');
    Route::get('visa/{visa}', [VisaController::class, 'show'])->name('visa.show');
    Route::get('visa/{visa}/edit', [VisaController::class, 'edit'])->name('visa.edit');
    Route::put('visa/{visa}', [VisaController::class, 'update'])->name('visa.update');
    Route::delete('visa/{visa}', [VisaController::class, 'destroy'])->name('visa.destroy');

    // ── Workflow actions ────────────────────────────────────────────────────
    Route::post('visa/{visa}/status', [VisaController::class, 'updateStatus'])->name('visa.update-status');
    Route::post('visa/{visa}/notes', [VisaController::class, 'updateNotes'])->name('visa.update-notes');

    // visa_documentation_officer / supervisor → triggers payment request to accounting_assistant
    Route::post('visa/{visa}/payment-request', [VisaController::class, 'sendPaymentRequest'])->name('visa.payment-request');

    // accounting_assistant records the OR number after payment matching
    Route::post('visa/{visa}/or', [VisaController::class, 'recordOr'])->name('visa.record-or');

    // liaison_officer_visa physically pays embassy then endorses OR back to the system
    Route::post('visa/{visa}/pay-embassy', [VisaController::class, 'payEmbassy'])->name('visa.pay-embassy');

    // visa_documentation_supervisor endorses OR to accounting after verification
    Route::post('visa/{visa}/endorse', [VisaController::class, 'endorseOr'])->name('visa.endorse-or');

    // ── Contact link (TIN auto-pull) ────────────────────────────────────────
    Route::post('visa/{visa}/link-contact', [VisaController::class, 'linkContact'])->name('visa.link-contact');
    Route::delete('visa/{visa}/link-contact', [VisaController::class, 'unlinkContact'])->name('visa.unlink-contact');
});
