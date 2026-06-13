<?php

use Illuminate\Support\Facades\Route;
use Modules\Disbursement\Http\Controllers\DisbursementController;

/*
|--------------------------------------------------------------------------
| Disbursement Module Routes
|--------------------------------------------------------------------------
|
| Preparers   : disbursement_officer, accounting_officer
| Checkers    : admin_auditor, general_manager
| Approvers   : general_manager (JRT only)
|
| Voucher approval chain: Prepared → Checked (Auditor) → Approved (JRT) → Released
| Disbursement entry is auto-created when a voucher is approved.
| Access file export is a Phase 9 stub.
*/

Route::middleware(['auth'])->group(function () {

    // ── Root redirect: /disbursement → /disbursement/vouchers ────────────
    Route::get('disbursement', function () {
        return redirect()->route('disbursement.vouchers.index');
    })->name('disbursement.index');

    // ── Vouchers ─────────────────────────────────────────────────────────
    Route::get('disbursement/vouchers', [DisbursementController::class, 'vouchersIndex'])->name('disbursement.vouchers.index');
    Route::get('disbursement/vouchers/create', [DisbursementController::class, 'voucherCreate'])->name('disbursement.vouchers.create');
    Route::post('disbursement/vouchers', [DisbursementController::class, 'voucherStore'])->name('disbursement.vouchers.store');
    Route::get('disbursement/vouchers/{voucher}', [DisbursementController::class, 'voucherShow'])->name('disbursement.vouchers.show');
    Route::get('disbursement/vouchers/{voucher}/edit', [DisbursementController::class, 'voucherEdit'])->name('disbursement.vouchers.edit');
    Route::put('disbursement/vouchers/{voucher}', [DisbursementController::class, 'voucherUpdate'])->name('disbursement.vouchers.update');
    Route::delete('disbursement/vouchers/{voucher}', [DisbursementController::class, 'voucherDestroy'])->name('disbursement.vouchers.destroy');

    // ── Voucher approval chain ────────────────────────────────────────────
    Route::post('disbursement/vouchers/{voucher}/check', [DisbursementController::class, 'voucherCheck'])->name('disbursement.vouchers.check');
    Route::post('disbursement/vouchers/{voucher}/approve', [DisbursementController::class, 'voucherApprove'])->name('disbursement.vouchers.approve');
    Route::post('disbursement/vouchers/{voucher}/release', [DisbursementController::class, 'voucherRelease'])->name('disbursement.vouchers.release');

    // ── PDF stub (Phase 9) ────────────────────────────────────────────────
    Route::post('disbursement/vouchers/{voucher}/pdf', [DisbursementController::class, 'voucherPdf'])->name('disbursement.vouchers.pdf');

    // ── Disbursement Ledger ───────────────────────────────────────────────
    Route::get('disbursement/ledger', [DisbursementController::class, 'ledgerIndex'])->name('disbursement.ledger.index');
    Route::get('disbursement/ledger/create', [DisbursementController::class, 'ledgerCreate'])->name('disbursement.ledger.create');
    Route::post('disbursement/ledger', [DisbursementController::class, 'ledgerStore'])->name('disbursement.ledger.store');
    Route::get('disbursement/ledger/{entry}/edit', [DisbursementController::class, 'ledgerEdit'])->name('disbursement.ledger.edit');
    Route::put('disbursement/ledger/{entry}', [DisbursementController::class, 'ledgerUpdate'])->name('disbursement.ledger.update');
    Route::delete('disbursement/ledger/{entry}', [DisbursementController::class, 'ledgerDestroy'])->name('disbursement.ledger.destroy');

    // ── Access file export ────────────────────────────────────────────────
    // Phase 9: GET so the browser downloads the file directly.
    // Pass ?period=first_half or ?period=second_half to override auto-detection.
    // Pass ?branch_id= (GM / Auditor only) to scope to a specific branch.
    Route::get('disbursement/access-file-export', [DisbursementController::class, 'accessFileExport'])->name('disbursement.access-file-export');
});
