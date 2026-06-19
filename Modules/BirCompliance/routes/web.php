<?php

use Illuminate\Support\Facades\Route;
use Modules\BirCompliance\Http\Controllers\BirComplianceController;

/*
|--------------------------------------------------------------------------
| BIR / Compliance Module Routes
|--------------------------------------------------------------------------
|
| View:     accounting_assistant, administrative_assistant,
|           finance_admin_supervisor, president, chief_operating_officer
| Create/Update: accounting_assistant
| Export:   finance_admin_supervisor (sends to external accountant)
| Audit:    administrative_assistant (adds audit remarks)
|
| Monthly BIR reminder is fired from a scheduled command.
| PDF generation delegates to DocumentGeneration module via route.
*/

Route::middleware(['auth'])->group(function () {

    Route::get('bir', function () {
        return redirect()->route('bir.index');
    })->name('bir');

    Route::get('bir/transactions', [BirComplianceController::class, 'index'])->name('bir.index');
    Route::get('bir/transactions/create', [BirComplianceController::class, 'create'])->name('bir.create');
    Route::post('bir/transactions', [BirComplianceController::class, 'store'])->name('bir.store');
    Route::get('bir/transactions/{birTransaction}', [BirComplianceController::class, 'show'])->name('bir.show');
    Route::get('bir/transactions/{birTransaction}/edit', [BirComplianceController::class, 'edit'])->name('bir.edit');
    Route::put('bir/transactions/{birTransaction}', [BirComplianceController::class, 'update'])->name('bir.update');
    Route::delete('bir/transactions/{birTransaction}', [BirComplianceController::class, 'destroy'])->name('bir.destroy');

    // Monthly report export — GET so the browser can stream the file directly
    Route::get('bir/export-monthly', [BirComplianceController::class, 'exportMonthly'])->name('bir.export-monthly');
});
