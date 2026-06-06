<?php

use Illuminate\Support\Facades\Route;
use Modules\IataPayments\Http\Controllers\IataPaymentsController;

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
    Route::post('/{payment}/notify', [IataPaymentsController::class, 'notify'])->name('notify');
});
