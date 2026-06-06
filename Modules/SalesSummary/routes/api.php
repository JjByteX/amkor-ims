<?php

use Illuminate\Support\Facades\Route;
use Modules\SalesSummary\Http\Controllers\SalesSummaryController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('salessummaries', SalesSummaryController::class)->names('salessummary');
});
