<?php

use Illuminate\Support\Facades\Route;
use Modules\BillsMonitoring\Http\Controllers\BillsMonitoringController;

/*
|--------------------------------------------------------------------------
| Bills & On-Ques Monitoring Routes
|--------------------------------------------------------------------------
|
| Preparers  : accounting_assistant
| Checkers   : administrative_assistant, finance_admin_supervisor
| Approvers  : president (JRT only)
| Executors  : liaison_officer_finance (marks paid after physical payment)
| Viewers    : + chief_operating_officer
|
| Approval chain: Prepared → Checked (Admin Asst) → Approved (President) → Paid (Liaison)
*/

Route::middleware(['auth', 'verified'])->prefix('bills')->name('bills.')->group(function () {

    Route::get('/', [BillsMonitoringController::class, 'index'])->name('index');
    Route::get('/create', [BillsMonitoringController::class, 'create'])->name('create');
    Route::post('/', [BillsMonitoringController::class, 'store'])->name('store');
    Route::get('/{bill}', [BillsMonitoringController::class, 'show'])->name('show');
    Route::get('/{bill}/edit', [BillsMonitoringController::class, 'edit'])->name('edit');
    Route::patch('/{bill}', [BillsMonitoringController::class, 'update'])->name('update');
    Route::delete('/{bill}', [BillsMonitoringController::class, 'destroy'])->name('destroy');

    // Approval chain
    Route::post('/{bill}/check', [BillsMonitoringController::class, 'check'])->name('check');
    Route::post('/{bill}/approve', [BillsMonitoringController::class, 'approve'])->name('approve');
    Route::post('/{bill}/release', [BillsMonitoringController::class, 'release'])->name('release');
});
