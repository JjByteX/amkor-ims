<?php

use Illuminate\Support\Facades\Route;
use Modules\Cashbond\Http\Controllers\CashbondController;

Route::middleware(['auth', 'verified'])->prefix('cashbond')->name('cashbond.')->group(function () {

    // Portals dashboard
    Route::get('/', [CashbondController::class, 'index'])->name('index');
    Route::patch('portals/{portal}', [CashbondController::class, 'updatePortal'])->name('portals.update');

    // Reload requests
    Route::get('reloads', [CashbondController::class, 'reloadsIndex'])->name('reloads.index');
    Route::get('reloads/create', [CashbondController::class, 'reloadCreate'])->name('reloads.create');
    Route::post('reloads', [CashbondController::class, 'reloadStore'])->name('reloads.store');
    Route::get('reloads/{reload}', [CashbondController::class, 'reloadShow'])->name('reloads.show');

    // Approval chain
    Route::post('reloads/{reload}/check', [CashbondController::class, 'reloadCheck'])->name('reloads.check');
    Route::post('reloads/{reload}/approve', [CashbondController::class, 'reloadApprove'])->name('reloads.approve');
    Route::post('reloads/{reload}/release', [CashbondController::class, 'reloadRelease'])->name('reloads.release');
    Route::post('reloads/{reload}/notify', [CashbondController::class, 'reloadNotify'])->name('reloads.notify');
});
