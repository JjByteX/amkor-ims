<?php

use Illuminate\Support\Facades\Route;
use Modules\CreditCardMonitoring\Http\Controllers\CreditCardMonitoringController;

Route::middleware(['auth', 'verified'])->prefix('credit-cards')->name('credit-cards.')->group(function () {

    // Cards master list
    Route::get('/cards', [CreditCardMonitoringController::class, 'cardsIndex'])->name('cards.index');
    Route::post('/cards', [CreditCardMonitoringController::class, 'cardStore'])->name('cards.store');
    Route::patch('/cards/{card}', [CreditCardMonitoringController::class, 'cardUpdate'])->name('cards.update');

    // Payments
    Route::get('/', [CreditCardMonitoringController::class, 'index'])->name('index');
    Route::get('/create', [CreditCardMonitoringController::class, 'create'])->name('create');
    Route::post('/', [CreditCardMonitoringController::class, 'store'])->name('store');
    Route::get('/{payment}', [CreditCardMonitoringController::class, 'show'])->name('show');

    // Approval chain
    Route::post('/{payment}/check', [CreditCardMonitoringController::class, 'check'])->name('check');
    Route::post('/{payment}/approve', [CreditCardMonitoringController::class, 'approve'])->name('approve');
    Route::post('/{payment}/release', [CreditCardMonitoringController::class, 'release'])->name('release');
});
