<?php

use Illuminate\Support\Facades\Route;
use Modules\Cashbond\Http\Controllers\CashbondController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('cashbonds', CashbondController::class)->names('cashbond');
});
