<?php

use Illuminate\Support\Facades\Route;
use Modules\EmployeeRecords\Http\Controllers\EmployeeRecordsController;

/*
|--------------------------------------------------------------------------
| Employee Records Module Routes
|--------------------------------------------------------------------------
|
| View:   hr_admin_officer, general_manager, admin_auditor
| Manage: hr_admin_officer, general_manager
| Delete: general_manager only
|
| Attendance is a separate module (Modules/Attendance).
*/

Route::middleware(['auth'])->group(function () {

    // ── Sidebar link: /hr ─────────────────────────────────────────────────
    // Sidebar.jsx links to /hr — redirect to the employees list.
    Route::get('hr', function () {
        return redirect()->route('employees.index');
    })->name('hr');

    // ── Employee CRUD ─────────────────────────────────────────────────────
    Route::get('hr/employees',              [EmployeeRecordsController::class, 'index'])->name('employees.index');
    Route::get('hr/employees/create',       [EmployeeRecordsController::class, 'create'])->name('employees.create');
    Route::post('hr/employees',             [EmployeeRecordsController::class, 'store'])->name('employees.store');
    Route::get('hr/employees/{employee}',   [EmployeeRecordsController::class, 'show'])->name('employees.show');
    Route::get('hr/employees/{employee}/edit', [EmployeeRecordsController::class, 'edit'])->name('employees.edit');
    Route::put('hr/employees/{employee}',   [EmployeeRecordsController::class, 'update'])->name('employees.update');
    Route::delete('hr/employees/{employee}',[EmployeeRecordsController::class, 'destroy'])->name('employees.destroy');

    // SIL quick-update
    Route::patch('hr/employees/{employee}/sil', [EmployeeRecordsController::class, 'updateSil'])->name('employees.sil');
});
