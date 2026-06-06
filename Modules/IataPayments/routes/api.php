<?php

use Illuminate\Support\Facades\Route;
use Modules\IataPayments\Http\Controllers\IataPaymentsController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('iatapayments', IataPaymentsController::class)->names('iatapayments');
});
