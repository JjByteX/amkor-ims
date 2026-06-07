<?php

use Illuminate\Support\Facades\Route;
use Modules\OrmocBranch\Http\Controllers\OrmocBranchController;

/*
|--------------------------------------------------------------------------
| Ormoc Branch Module Routes
|--------------------------------------------------------------------------
|
| Write roles : ormoc_branch_officer, general_manager
| View roles  : + accounting_officer, disbursement_officer, admin_auditor
|
| Branch enforcement: ormoc_branch_officer is locked to Ormoc records only
| by both the controller and the CheckBranch middleware.
*/

Route::middleware(['auth'])->group(function () {

    // ── CRUD ───────────────────────────────────────────────────────────────
    Route::get('ormoc', [OrmocBranchController::class, 'index'])->name('ormoc.index');
    Route::get('ormoc/create', [OrmocBranchController::class, 'create'])->name('ormoc.create');
    Route::post('ormoc', [OrmocBranchController::class, 'store'])->name('ormoc.store');
    Route::get('ormoc/{ormoc}', [OrmocBranchController::class, 'show'])->name('ormoc.show');
    Route::get('ormoc/{ormoc}/edit', [OrmocBranchController::class, 'edit'])->name('ormoc.edit');
    Route::put('ormoc/{ormoc}', [OrmocBranchController::class, 'update'])->name('ormoc.update');
    Route::delete('ormoc/{ormoc}', [OrmocBranchController::class, 'destroy'])->name('ormoc.destroy');

    // ── Workflow actions ────────────────────────────────────────────────────
    Route::post('ormoc/{ormoc}/status', [OrmocBranchController::class, 'updateStatus'])->name('ormoc.update-status');
    Route::post('ormoc/{ormoc}/notes', [OrmocBranchController::class, 'updateNotes'])->name('ormoc.update-notes');
    Route::post('ormoc/{ormoc}/escalate', [OrmocBranchController::class, 'escalate'])->name('ormoc.escalate');
    Route::post('ormoc/{ormoc}/mariposa', [OrmocBranchController::class, 'markPoToMariposa'])->name('ormoc.mariposa');
    Route::post('ormoc/{ormoc}/forward-accounting', [OrmocBranchController::class, 'forwardToAccounting'])->name('ormoc.forward-accounting');
});
