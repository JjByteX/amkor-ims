<?php

use Illuminate\Support\Facades\Route;
use Modules\Reservation\Http\Controllers\ReservationController;
use Modules\Reservation\Http\Controllers\AirlineRateController;

Route::middleware(['auth'])->group(function () {
    Route::get('reservation', [ReservationController::class, 'index'])->name('reservation.index');
    Route::get('reservation/sales-report', [ReservationController::class, 'salesReport'])->name('reservation.sales-report');
    Route::get('reservation/create', [ReservationController::class, 'create'])->name('reservation.create');
    Route::post('reservation', [ReservationController::class, 'store'])->name('reservation.store');
    Route::get('reservation/{booking}', [ReservationController::class, 'show'])->name('reservation.show');
    Route::get('reservation/{booking}/edit', [ReservationController::class, 'edit'])->name('reservation.edit');
    Route::put('reservation/{booking}', [ReservationController::class, 'update'])->name('reservation.update');
    Route::delete('reservation/{booking}', [ReservationController::class, 'destroy'])->name('reservation.destroy');
    Route::post('reservation/{booking}/status', [ReservationController::class, 'updateStatus'])->name('reservation.status');
    Route::post('reservation/{booking}/forward-accounting', [ReservationController::class, 'forwardToAccounting'])->name('reservation.forward-accounting');

    // ── Contact link (TIN auto-pull) ────────────────────────────────────────
    Route::post('reservation/{booking}/link-contact', [ReservationController::class, 'linkContact'])->name('reservation.link-contact');
    Route::delete('reservation/{booking}/link-contact', [ReservationController::class, 'unlinkContact'])->name('reservation.unlink-contact');

    // ── Airline Rates ────────────────────────────────────────────────────────
    Route::get('airline-rates', [AirlineRateController::class, 'index'])->name('airline-rates.index');
    Route::post('airline-rates', [AirlineRateController::class, 'store'])->name('airline-rates.store');
    Route::put('airline-rates/{airlineRate}', [AirlineRateController::class, 'update'])->name('airline-rates.update');
    Route::delete('airline-rates/{airlineRate}', [AirlineRateController::class, 'destroy'])->name('airline-rates.destroy');
});
