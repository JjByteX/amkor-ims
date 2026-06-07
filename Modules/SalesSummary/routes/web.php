<?php

use Illuminate\Support\Facades\Route;
use Modules\SalesSummary\Http\Controllers\SalesSummaryController;

Route::middleware(['auth'])->group(function () {
    Route::get('sales', [SalesSummaryController::class, 'index'])->name('sales.index');
    Route::post('sales/targets', [SalesSummaryController::class, 'storeTarget'])->name('sales.targets.store');
    Route::get('sales/export', [SalesSummaryController::class, 'export'])->name('sales.export');
});
