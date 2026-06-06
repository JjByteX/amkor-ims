<?php

use Illuminate\Support\Facades\Route;
use Modules\AccountsPayable\Http\Controllers\AccountsPayableController;

/*
|--------------------------------------------------------------------------
| Accounts Payable / Operator Payables Routes
|--------------------------------------------------------------------------
|
| Preparers  : accounting_officer, disbursement_officer
| Checkers   : admin_auditor, general_manager
| Approvers  : general_manager (JRT only)
| Viewers    : + resa_officer (originate payment requests)
|
| Approval chain: Prepared → Checked (Auditor) → Approved (JRT) → Released
| Note: USD transactions are always settled in cash, never check.
*/

Route::middleware(['auth'])->group(function () {

    // ── CRUD ─────────────────────────────────────────────────────────────
    Route::get('payables',             [AccountsPayableController::class, 'index'])->name('ap.index');
    Route::get('payables/create',      [AccountsPayableController::class, 'create'])->name('ap.create');
    Route::post('payables',            [AccountsPayableController::class, 'store'])->name('ap.store');
    Route::get('payables/{ap}',        [AccountsPayableController::class, 'show'])->name('ap.show');
    Route::get('payables/{ap}/edit',   [AccountsPayableController::class, 'edit'])->name('ap.edit');
    Route::put('payables/{ap}',        [AccountsPayableController::class, 'update'])->name('ap.update');
    Route::delete('payables/{ap}',     [AccountsPayableController::class, 'destroy'])->name('ap.destroy');

    // ── Approval chain ────────────────────────────────────────────────────
    Route::post('payables/{ap}/check',   [AccountsPayableController::class, 'check'])->name('ap.check');
    Route::post('payables/{ap}/approve', [AccountsPayableController::class, 'approve'])->name('ap.approve');
    Route::post('payables/{ap}/release', [AccountsPayableController::class, 'release'])->name('ap.release');

    // ── Payment recording ─────────────────────────────────────────────────
    Route::post('payables/{ap}/payment', [AccountsPayableController::class, 'recordPayment'])->name('ap.record-payment');
});
