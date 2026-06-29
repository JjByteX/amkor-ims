<?php

use Illuminate\Support\Facades\Route;
use Modules\Reservation\Http\Controllers\ReservationController;
use Modules\Reservation\Http\Controllers\AirlineRateController;
use Modules\Reservation\Http\Controllers\TourPackageController;

/*
|--------------------------------------------------------------------------
| Reservation & Booking Module Routes
|--------------------------------------------------------------------------
|
| This module handles bookings for ALL branches — QC and Ormoc.
| Branch scoping is enforced in the controller, not in routes.
|
| Create/Update : sales_reservation_officer (own bookings — QC)
|                 sales_ticketing_officer (own bookings — QC)
|                 group_sales_officer (own bookings — QC)
|                 branch_sales_officer (own bookings — Ormoc)
|                 branch_supervisor (all Ormoc branch bookings)
|                 general_sales_manager, chief_operating_officer, president
|                 accounting_assistant
|
| Escalation    : branch_supervisor, branch_sales_officer → escalate to QC
|                 sales_ticketing_officer, president → acknowledge escalation
|
| Delete        : president only
|
| Airline Rates:
|   Manage : general_sales_manager, president, chief_operating_officer
|   View   : all reservation + Ormoc roles
|
| Tour Packages:
|   Manage : president, chief_operating_officer, general_sales_manager
|   View   : all reservation + Ormoc roles
|   Search : JSON endpoint used by booking form for autofill (GET tour-packages/search)
*/

Route::middleware(['auth'])->group(function () {

    // ── CRUD ────────────────────────────────────────────────────────────────
    Route::get('reservation',              [ReservationController::class, 'index'])->name('reservation.index');
    Route::get('reservation/create',       [ReservationController::class, 'create'])->name('reservation.create');
    Route::post('reservation',             [ReservationController::class, 'store'])->name('reservation.store');
    Route::get('reservation/{booking}',    [ReservationController::class, 'show'])->name('reservation.show');
    Route::get('reservation/{booking}/edit', [ReservationController::class, 'edit'])->name('reservation.edit');
    Route::put('reservation/{booking}',    [ReservationController::class, 'update'])->name('reservation.update');
    Route::delete('reservation/{booking}', [ReservationController::class, 'destroy'])->name('reservation.destroy');

    // ── Workflow actions ─────────────────────────────────────────────────────
    Route::post('reservation/{booking}/status',           [ReservationController::class, 'updateStatus'])->name('reservation.status');
    Route::post('reservation/{booking}/notes',            [ReservationController::class, 'updateNotes'])->name('reservation.update-notes');
    Route::post('reservation/{booking}/forward-accounting', [ReservationController::class, 'forwardToAccounting'])->name('reservation.forward-accounting');

    // ── Ormoc escalation workflow ─────────────────────────────────────────────
    // branch_supervisor / branch_sales_officer escalates → sales_ticketing_officer (QC) acknowledges
    Route::post('reservation/{booking}/escalate',             [ReservationController::class, 'escalate'])->name('reservation.escalate');
    Route::post('reservation/{booking}/escalate/acknowledge', [ReservationController::class, 'acknowledgeEscalation'])->name('reservation.escalate-acknowledge');
    // Legacy route — kept so existing frontend keeps working; delegates to markPoToOperator
    Route::post('reservation/{booking}/mariposa',             [ReservationController::class, 'markPoToMariposa'])->name('reservation.mariposa');
    // Phase 2.5 — new generalised route; accepts optional operator_id in request body
    Route::post('reservation/{booking}/po-operator',          [ReservationController::class, 'markPoToOperator'])->name('reservation.po-operator');

    // ── Contact link (TIN auto-pull) ─────────────────────────────────────────
    Route::post('reservation/{booking}/link-contact',   [ReservationController::class, 'linkContact'])->name('reservation.link-contact');
    Route::delete('reservation/{booking}/link-contact', [ReservationController::class, 'unlinkContact'])->name('reservation.unlink-contact');

    // ── Airline Rates ────────────────────────────────────────────────────────
    // search must be declared before {airlineRate} for the same reason as tour packages.
    Route::get('airline-rates/search',              [AirlineRateController::class, 'search'])->name('airline-rates.search');
    Route::get('airline-rates',                     [AirlineRateController::class, 'index'])->name('airline-rates.index');
    Route::post('airline-rates',                    [AirlineRateController::class, 'store'])->name('airline-rates.store');
    Route::put('airline-rates/{airlineRate}',       [AirlineRateController::class, 'update'])->name('airline-rates.update');
    Route::delete('airline-rates/{airlineRate}',    [AirlineRateController::class, 'destroy'])->name('airline-rates.destroy');

    // ── Tour Packages ────────────────────────────────────────────────────────
    // search must be declared before {tourPackage} so Laravel does not try
    // to resolve the literal string "search" as a model ID.
    Route::get('tour-packages/search',               [TourPackageController::class, 'search'])->name('tour-packages.search');
    Route::get('tour-packages',                      [TourPackageController::class, 'index'])->name('tour-packages.index');
    Route::post('tour-packages',                     [TourPackageController::class, 'store'])->name('tour-packages.store');
    Route::put('tour-packages/{tourPackage}',         [TourPackageController::class, 'update'])->name('tour-packages.update');
    Route::delete('tour-packages/{tourPackage}',      [TourPackageController::class, 'destroy'])->name('tour-packages.destroy');
});
