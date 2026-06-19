<?php

use Illuminate\Support\Facades\Route;
use Modules\EmployeeRecords\Http\Controllers\EmployeeRecordsController;

/*
|--------------------------------------------------------------------------
| Employee Records Module Routes
|--------------------------------------------------------------------------
|
| View all:    finance_admin_supervisor, administrative_assistant,
|              president, chief_operating_officer
| View own:    all other authenticated roles (own record only)
| Create/Edit: finance_admin_supervisor, administrative_assistant, president
| Delete:      president only
|
| HR is centralised at QC Main. Ormoc branch staff records are managed
| by the finance_admin_supervisor at head office.
|
| Attendance is a separate module (Modules/Attendance).
*/

Route::middleware(['auth'])->group(function () {

    // ── Sidebar link: /hr ─────────────────────────────────────────────────
    Route::get('hr', function () {
        return redirect()->route('employees.index');
    })->name('hr');

    // ── Employee CRUD ─────────────────────────────────────────────────────
    Route::get('hr/employees', [EmployeeRecordsController::class, 'index'])->name('employees.index');
    Route::get('hr/employees/create', [EmployeeRecordsController::class, 'create'])->name('employees.create');
    Route::post('hr/employees', [EmployeeRecordsController::class, 'store'])->name('employees.store');
    Route::get('hr/employees/{employee}', [EmployeeRecordsController::class, 'show'])->name('employees.show');
    Route::get('hr/employees/{employee}/edit', [EmployeeRecordsController::class, 'edit'])->name('employees.edit');
    Route::put('hr/employees/{employee}', [EmployeeRecordsController::class, 'update'])->name('employees.update');
    Route::delete('hr/employees/{employee}', [EmployeeRecordsController::class, 'destroy'])->name('employees.destroy');

    // SIL quick-update
    Route::patch('hr/employees/{employee}/sil', [EmployeeRecordsController::class, 'updateSil'])->name('employees.sil');
});
