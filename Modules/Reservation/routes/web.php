<?php

use Illuminate\Support\Facades\Route;
use Modules\Reservation\Http\Controllers\ReservationController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('reservations', ReservationController::class)->names('reservation');
});
