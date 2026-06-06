<?php

use Illuminate\Support\Facades\Route;
use Modules\AccountsPayable\Http\Controllers\AccountsPayableController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('accountspayables', AccountsPayableController::class)->names('accountspayable');
});
