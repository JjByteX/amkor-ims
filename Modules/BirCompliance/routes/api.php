<?php

use Illuminate\Support\Facades\Route;
use Modules\BirCompliance\Http\Controllers\BirComplianceController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('bircompliances', BirComplianceController::class)->names('bircompliance');
});
