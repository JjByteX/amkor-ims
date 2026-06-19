<?php

use Illuminate\Support\Facades\Route;
use Modules\OrmocBranch\Http\Controllers\OrmocBranchController;

/*
|--------------------------------------------------------------------------
| Ormoc Branch Module Routes
|--------------------------------------------------------------------------
|
| Write roles  : branch_sales_officer (own bookings only),
|                branch_supervisor (all Ormoc records),
|                sales_ticketing_officer (escalated records only — OIC),
|                general_sales_manager, chief_operating_officer, president
| View roles   : + accounting_assistant, administrative_assistant,
|                  finance_admin_supervisor
|
| Branch enforcement:
|   branch_sales_officer  → own bookings only (scoped in controller)
|   branch_supervisor     → all Ormoc records
|   sales_ticketing_officer → escalated records only (scoped in controller)
|
| Escalation flow:
|   branch_supervisor approves → escalates to sales_ticketing_officer (QC)
|   for international/complex bookings → forwarded to accounting_assistant
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

    // branch_supervisor approves before forwarding; escalates to sales_ticketing_officer
    Route::post('ormoc/{ormoc}/approve', [OrmocBranchController::class, 'approve'])->name('ormoc.approve');
    Route::post('ormoc/{ormoc}/escalate', [OrmocBranchController::class, 'escalate'])->name('ormoc.escalate');
    Route::post('ormoc/{ormoc}/escalate/acknowledge', [OrmocBranchController::class, 'acknowledgeEscalation'])->name('ormoc.escalate-acknowledge');
    Route::post('ormoc/{ormoc}/mariposa', [OrmocBranchController::class, 'markPoToMariposa'])->name('ormoc.mariposa');

    // Forwards invoice + quotation + payment details to accounting_assistant
    Route::post('ormoc/{ormoc}/forward-accounting', [OrmocBranchController::class, 'forwardToAccounting'])->name('ormoc.forward-accounting');

    // ── Contact link (TIN auto-pull) ────────────────────────────────────────
    Route::post('ormoc/{ormoc}/link-contact', [OrmocBranchController::class, 'linkContact'])->name('ormoc.link-contact');
    Route::delete('ormoc/{ormoc}/link-contact', [OrmocBranchController::class, 'unlinkContact'])->name('ormoc.unlink-contact');
});
