<?php

use Illuminate\Support\Facades\Route;
use Modules\AccountsReceivable\Http\Controllers\AccountsReceivableController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('accountsreceivables', AccountsReceivableController::class)->names('accountsreceivable');
});
