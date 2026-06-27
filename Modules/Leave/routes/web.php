<?php

use Illuminate\Support\Facades\Route;
use Modules\Leave\Http\Controllers\LeaveController;

/*
|--------------------------------------------------------------------------
| Leave Requests Module Routes
|--------------------------------------------------------------------------
|
| View own:       all authenticated users
| View all:       finance_admin_supervisor, president, chief_operating_officer,
|                 administrative_assistant, branch_supervisor (own branch)
| Approve/Reject: finance_admin_supervisor, president, chief_operating_officer,
|                 administrative_assistant, branch_supervisor (own branch)
| Cancel:         the filing employee (pending requests only)
*/

Route::middleware(['auth'])->group(function () {

    // Sidebar shortcut — /leave → /hr/leave
    Route::get('leave', function () {
        return redirect('/hr/leave');
    })->name('leave');

});

Route::middleware(['auth'])->prefix('hr/leave')->name('leave.')->group(function () {

    Route::get('/',        [LeaveController::class, 'index'])->name('index');
    Route::post('/',       [LeaveController::class, 'store'])->name('store');
    Route::delete('/{leave}', [LeaveController::class, 'destroy'])->name('destroy');

    Route::patch('/{leave}/approve', [LeaveController::class, 'approve'])->name('approve');
    Route::patch('/{leave}/reject',  [LeaveController::class, 'reject'])->name('reject');
    Route::patch('/{leave}/cancel',  [LeaveController::class, 'cancel'])->name('cancel');

});
