<?php

use Illuminate\Support\Facades\Route;
use Modules\Visa\Http\Controllers\VisaController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('visas', VisaController::class)->names('visa');
});
