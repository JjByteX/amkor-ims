<?php

use Illuminate\Support\Facades\Route;
use Modules\SalesSummary\Http\Controllers\SalesSummaryController;

/*
|--------------------------------------------------------------------------
| Sales Summary Report Routes
|--------------------------------------------------------------------------
|
| View all branches + depts : president, chief_operating_officer,
|                             finance_admin_supervisor, administrative_assistant,
|                             accounting_assistant, general_sales_manager
| View own department only  : business_development_manager,
|                             visa_documentation_supervisor
| View own branch only      : branch_supervisor
| View own agent summary    : sales_reservation_officer, sales_ticketing_officer,
|                             group_sales_officer, visa_documentation_officer,
|                             branch_sales_officer
|
| Set targets : general_sales_manager, president, chief_operating_officer
| Export      : president, chief_operating_officer, finance_admin_supervisor,
|               accounting_assistant, general_sales_manager,
|               business_development_manager, visa_documentation_supervisor,
|               branch_supervisor
|
| Scoping is enforced in the SalesSummaryController — the route layer
| is open to all authenticated users; the controller gates each view level.
*/

Route::middleware(['auth'])->group(function () {
    Route::get('sales', [SalesSummaryController::class, 'index'])->name('sales.index');
    Route::post('sales/targets', [SalesSummaryController::class, 'storeTarget'])->name('sales.targets.store');
    Route::get('sales/export', [SalesSummaryController::class, 'export'])->name('sales.export');
});
