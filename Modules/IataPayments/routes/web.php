<?php

use Illuminate\Support\Facades\Route;
use Modules\IataPayments\Http\Controllers\IataPaymentsController;

/*
|--------------------------------------------------------------------------
| IATA Payments Routes
|--------------------------------------------------------------------------
|
| Preparers  : accounting_assistant
| Checkers   : administrative_assistant, finance_admin_supervisor
| Approvers  : president (JRT only)
| Executors  : liaison_officer_finance (marks deposited, emails operator with deposit slip)
| Viewers    : + chief_operating_officer, general_sales_manager
|
| Approval chain:
|   Prepared (Accounting) → Checked (Admin Asst) → Approved (President)
|   → Deposited + Email (Liaison Finance)
*/

Route::middleware(['auth', 'verified'])->prefix('iata')->name('iata.')->group(function () {

    Route::get('/', [IataPaymentsController::class, 'index'])->name('index');
    Route::get('/create', [IataPaymentsController::class, 'create'])->name('create');
    Route::post('/', [IataPaymentsController::class, 'store'])->name('store');
    Route::get('/{payment}', [IataPaymentsController::class, 'show'])->name('show');
    Route::get('/{payment}/edit', [IataPaymentsController::class, 'edit'])->name('edit');
    Route::patch('/{payment}', [IataPaymentsController::class, 'update'])->name('update');
    Route::delete('/{payment}', [IataPaymentsController::class, 'destroy'])->name('destroy');

    // Approval chain
    Route::post('/{payment}/check', [IataPaymentsController::class, 'check'])->name('check');
    Route::post('/{payment}/approve', [IataPaymentsController::class, 'approve'])->name('approve');
    Route::post('/{payment}/release', [IataPaymentsController::class, 'release'])->name('release');

    // Liaison Finance: marks deposited + emails operator with deposit slip
    Route::post('/{payment}/notify', [IataPaymentsController::class, 'notify'])->name('notify');
});
