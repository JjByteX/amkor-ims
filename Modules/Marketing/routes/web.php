<?php

use Illuminate\Support\Facades\Route;
use Modules\Marketing\Http\Controllers\MarketingController;

/*
|--------------------------------------------------------------------------
| Marketing Module Routes
|--------------------------------------------------------------------------
|
| Create/Update own : sales_marketing_officer (own materials only)
| Create/Update all : business_development_manager
| Approve/Publish   : chief_operating_officer (reviews before publish),
|                     business_development_manager
| View itineraries  : all sales roles (read-only published itineraries)
| View expenses     : accounting_assistant
| Delete            : president only
|
| Workflow:
|   Draft (sales_marketing_officer) → Submitted → Approved (COO) → Published
*/

Route::middleware(['auth', 'verified'])->prefix('marketing')->name('marketing.')->group(function () {

    // ── Materials (main resource) ─────────────────────────────────────────────
    Route::get('/', [MarketingController::class, 'index'])->name('index');
    Route::get('/create', [MarketingController::class, 'create'])->name('create');
    Route::post('/', [MarketingController::class, 'store'])->name('store');
    Route::get('/{marketing}', [MarketingController::class, 'show'])->name('show');
    Route::get('/{marketing}/edit', [MarketingController::class, 'edit'])->name('edit');
    Route::put('/{marketing}', [MarketingController::class, 'update'])->name('update');

    // Workflow actions
    Route::post('/{marketing}/submit', [MarketingController::class, 'submit'])->name('submit');
    Route::post('/{marketing}/approve', [MarketingController::class, 'approve'])->name('approve');
    Route::post('/{marketing}/reject', [MarketingController::class, 'reject'])->name('reject');
    Route::post('/{marketing}/publish', [MarketingController::class, 'publish'])->name('publish');
    Route::post('/{marketing}/archive', [MarketingController::class, 'archive'])->name('archive');

    // ── Expenses ──────────────────────────────────────────────────────────────
    Route::get('/expenses/list', [MarketingController::class, 'expenses'])->name('expenses');
    Route::post('/expenses', [MarketingController::class, 'storeExpense'])->name('expenses.store');
    Route::put('/expenses/{expense}', [MarketingController::class, 'updateExpense'])->name('expenses.update');
    Route::post('/expenses/{expense}/approve', [MarketingController::class, 'approveExpense'])->name('expenses.approve');

    // ── Analytics ─────────────────────────────────────────────────────────────
    Route::get('/analytics/overview', [MarketingController::class, 'analytics'])->name('analytics');
});
