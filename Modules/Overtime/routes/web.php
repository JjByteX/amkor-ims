<?php

use Illuminate\Support\Facades\Route;
use Modules\Overtime\Http\Controllers\OvertimeController;

/*
|--------------------------------------------------------------------------
| Overtime Requests Module Routes
|--------------------------------------------------------------------------
|
| View own:       all authenticated users
| View all:       finance_admin_supervisor, president, chief_operating_officer,
|                 administrative_assistant, branch_supervisor (own branch)
| Approve/Reject: finance_admin_supervisor, president, chief_operating_officer,
|                 administrative_assistant, branch_supervisor (own branch)
| Cancel:         the filing employee (pending requests only)
| On Behalf Of:   branch_supervisor (own branch) + HR roles
*/

Route::middleware(['auth'])->group(function () {

    // Sidebar shortcut — /overtime → /hr/overtime
    Route::get('overtime', function () {
        return redirect('/hr/overtime');
    })->name('overtime');

});

Route::middleware(['auth'])->prefix('hr/overtime')->name('overtime.')->group(function () {

    Route::get('/',           [OvertimeController::class, 'index'])->name('index');
    Route::post('/',          [OvertimeController::class, 'store'])->name('store');
    Route::delete('/{overtime}', [OvertimeController::class, 'destroy'])->name('destroy');

    Route::patch('/{overtime}/approve', [OvertimeController::class, 'approve'])->name('approve');
    Route::patch('/{overtime}/reject',  [OvertimeController::class, 'reject'])->name('reject');
    Route::patch('/{overtime}/cancel',  [OvertimeController::class, 'cancel'])->name('cancel');

});
