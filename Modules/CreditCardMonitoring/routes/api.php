<?php

use Illuminate\Support\Facades\Route;
use Modules\CreditCardMonitoring\Http\Controllers\CreditCardMonitoringController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('creditcardmonitorings', CreditCardMonitoringController::class)->names('creditcardmonitoring');
});
