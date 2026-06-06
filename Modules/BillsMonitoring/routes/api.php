<?php

use Illuminate\Support\Facades\Route;
use Modules\BillsMonitoring\Http\Controllers\BillsMonitoringController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('billsmonitorings', BillsMonitoringController::class)->names('billsmonitoring');
});
