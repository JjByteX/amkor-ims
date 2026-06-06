<?php

use Illuminate\Support\Facades\Route;
use Modules\SalesSummary\Http\Controllers\SalesSummaryController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('salessummaries', SalesSummaryController::class)->names('salessummary');
});
