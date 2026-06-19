<?php

use Illuminate\Support\Facades\Route;
use Modules\AccountsReceivable\Http\Controllers\AccountsReceivableController;

/*
|--------------------------------------------------------------------------
| Accounts Receivable / Collectibles Routes
|--------------------------------------------------------------------------
|
| Originators : sales_reservation_officer, sales_ticketing_officer,
|               group_sales_officer, branch_sales_officer,
|               visa_documentation_officer, visa_documentation_supervisor,
|               accounting_assistant
| Approvers   : chief_operating_officer, general_sales_manager, president
| Viewers     : + administrative_assistant, finance_admin_supervisor,
|               liaison_officer_finance
|
| Both COO and GSM must approve before post-approval actions unlock.
*/

Route::middleware(['auth'])->group(function () {

    // ── CRUD ────────────────────────────────────────────────────────────────
    Route::get('ar', [AccountsReceivableController::class, 'index'])->name('ar.index');
    Route::get('ar/create', [AccountsReceivableController::class, 'create'])->name('ar.create');
    Route::post('ar', [AccountsReceivableController::class, 'store'])->name('ar.store');
    Route::get('ar/{ar}', [AccountsReceivableController::class, 'show'])->name('ar.show');
    Route::get('ar/{ar}/edit', [AccountsReceivableController::class, 'edit'])->name('ar.edit');
    Route::put('ar/{ar}', [AccountsReceivableController::class, 'update'])->name('ar.update');
    Route::delete('ar/{ar}', [AccountsReceivableController::class, 'destroy'])->name('ar.destroy');

    // ── Approval (parallel COO + GSM) ────────────────────────────────────────
    Route::post('ar/{ar}/approve-coo', [AccountsReceivableController::class, 'approveCoo'])->name('ar.approve-coo');
    Route::post('ar/{ar}/approve-gsm', [AccountsReceivableController::class, 'approveGsm'])->name('ar.approve-gsm');

    // ── Payment recording ─────────────────────────────────────────────────────
    Route::post('ar/{ar}/payment', [AccountsReceivableController::class, 'recordPayment'])->name('ar.record-payment');

    // ── Post-approval actions (unlock only when both COO + GSM approved) ──────
    Route::post('ar/{ar}/endorse-disbursement', [AccountsReceivableController::class, 'endorseToDisbursement'])->name('ar.endorse-disbursement');
    Route::post('ar/{ar}/process-refund', [AccountsReceivableController::class, 'processRefund'])->name('ar.process-refund');
    Route::post('ar/{ar}/endorse-documents', [AccountsReceivableController::class, 'endorseDocuments'])->name('ar.endorse-documents');
});
