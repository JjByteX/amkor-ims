<?php

use Illuminate\Support\Facades\Route;
use Modules\Visa\Http\Controllers\VisaController;

/*
|--------------------------------------------------------------------------
| Visa & Documentation Module Routes
|--------------------------------------------------------------------------
|
| Write roles : visa_documentation_officer, general_manager
| View roles  : + disbursement_officer, admin_auditor, accounting_officer
| Liaison Officer has no system view — physical tasks only.
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
    Route::post('visa/{visa}/payment-request', [VisaController::class, 'sendPaymentRequest'])->name('visa.payment-request');
    Route::post('visa/{visa}/or', [VisaController::class, 'recordOr'])->name('visa.record-or');
    Route::post('visa/{visa}/endorse', [VisaController::class, 'endorseOr'])->name('visa.endorse-or');

    // ── Contact link (TIN auto-pull) ────────────────────────────────────────
    Route::post('visa/{visa}/link-contact', [VisaController::class, 'linkContact'])->name('visa.link-contact');
    Route::delete('visa/{visa}/link-contact', [VisaController::class, 'unlinkContact'])->name('visa.unlink-contact');
});
