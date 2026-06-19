<?php

use Illuminate\Support\Facades\Route;
use Modules\Cashbond\Http\Controllers\CashbondController;

/*
|--------------------------------------------------------------------------
| Cashbond Monitoring Routes
|--------------------------------------------------------------------------
|
| Preparers  : accounting_assistant (monitors balances, prepares reload requests)
| Checkers   : administrative_assistant
| Approvers  : finance_admin_supervisor (approves reload), president (final)
| Executors  : liaison_officer_finance (executes deposit, marks as reloaded)
| Read-only  : sales_reservation_officer, sales_ticketing_officer,
|              group_sales_officer, branch_supervisor, branch_sales_officer
|              (portal balances only — before finalizing bookings)
| Viewers    : + chief_operating_officer, general_sales_manager, president
|
| Approval chain: Prepared (Accounting) → Checked (Admin Asst) →
|                 Approved (Fin/Admin Supervisor) → Deposited (Liaison Finance)
*/

Route::middleware(['auth', 'verified'])->prefix('cashbond')->name('cashbond.')->group(function () {

    // Main dashboard — stat cards + reload table
    Route::get('/', [CashbondController::class, 'index'])->name('index');

    // Reload requests
    Route::get('reloads/create', [CashbondController::class, 'reloadCreate'])->name('reloads.create');
    Route::post('reloads', [CashbondController::class, 'reloadStore'])->name('reloads.store');
    Route::get('reloads/{reload}', [CashbondController::class, 'reloadShow'])->name('reloads.show');

    // Approval chain
    Route::post('reloads/{reload}/check', [CashbondController::class, 'reloadCheck'])->name('reloads.check');
    Route::post('reloads/{reload}/approve', [CashbondController::class, 'reloadApprove'])->name('reloads.approve');
    Route::post('reloads/{reload}/release', [CashbondController::class, 'reloadRelease'])->name('reloads.release');
    Route::post('reloads/{reload}/notify', [CashbondController::class, 'reloadNotify'])->name('reloads.notify');
});
