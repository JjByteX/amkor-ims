<?php

use Illuminate\Support\Facades\Route;
use Modules\Reservation\Http\Controllers\ReservationController;
use Modules\Reservation\Http\Controllers\AirlineRateController;

/*
|--------------------------------------------------------------------------
| Reservation & Booking Module Routes
|--------------------------------------------------------------------------
|
| Create/Update : sales_reservation_officer (own bookings only),
|                 sales_ticketing_officer (own bookings only),
|                 group_sales_officer (own bookings only),
|                 general_sales_manager, chief_operating_officer, president
| View own      : sales_reservation_officer, sales_ticketing_officer,
|                 group_sales_officer
| View all      : general_sales_manager, chief_operating_officer, president,
|                 accounting_assistant, administrative_assistant,
|                 finance_admin_supervisor, business_development_manager
| Forward acct  : sales_reservation_officer, sales_ticketing_officer,
|                 group_sales_officer, general_sales_manager,
|                 chief_operating_officer, president
| Delete        : president only
|
| Airline Rates:
|   Manage : general_sales_manager, president, chief_operating_officer
|   View   : all reservation roles
*/

Route::middleware(['auth'])->group(function () {
    Route::get('reservation', [ReservationController::class, 'index'])->name('reservation.index');
    Route::get('reservation/create', [ReservationController::class, 'create'])->name('reservation.create');
    Route::post('reservation', [ReservationController::class, 'store'])->name('reservation.store');
    Route::get('reservation/{booking}', [ReservationController::class, 'show'])->name('reservation.show');
    Route::get('reservation/{booking}/edit', [ReservationController::class, 'edit'])->name('reservation.edit');
    Route::put('reservation/{booking}', [ReservationController::class, 'update'])->name('reservation.update');
    Route::delete('reservation/{booking}', [ReservationController::class, 'destroy'])->name('reservation.destroy');
    Route::post('reservation/{booking}/status', [ReservationController::class, 'updateStatus'])->name('reservation.status');

    // Forwards invoice + quotation + payment details to accounting_assistant
    Route::post('reservation/{booking}/forward-accounting', [ReservationController::class, 'forwardToAccounting'])->name('reservation.forward-accounting');

    // ── Contact link (TIN auto-pull) ────────────────────────────────────────
    Route::post('reservation/{booking}/link-contact', [ReservationController::class, 'linkContact'])->name('reservation.link-contact');
    Route::delete('reservation/{booking}/link-contact', [ReservationController::class, 'unlinkContact'])->name('reservation.unlink-contact');

    // ── Sales Report ────────────────────────────────────────────────────────
    // general_sales_manager, chief_operating_officer, president → full report
    // sales_* officers → own summary only (scoped in controller)
    Route::get('reservation/sales-report', [ReservationController::class, 'salesReport'])->name('reservation.sales-report');

    // ── Airline Rates ────────────────────────────────────────────────────────
    Route::get('airline-rates', [AirlineRateController::class, 'index'])->name('airline-rates.index');
    Route::post('airline-rates', [AirlineRateController::class, 'store'])->name('airline-rates.store');
    Route::put('airline-rates/{airlineRate}', [AirlineRateController::class, 'update'])->name('airline-rates.update');
    Route::delete('airline-rates/{airlineRate}', [AirlineRateController::class, 'destroy'])->name('airline-rates.destroy');
});
