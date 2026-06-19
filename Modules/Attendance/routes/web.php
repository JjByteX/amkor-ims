<?php

use Illuminate\Support\Facades\Route;
use Modules\Attendance\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| Attendance Module Routes
|--------------------------------------------------------------------------
|
| View all:    finance_admin_supervisor, president, administrative_assistant,
|              chief_operating_officer
| View team:   general_sales_manager, branch_supervisor,
|              visa_documentation_supervisor, business_development_manager
| Manage/edit: finance_admin_supervisor, president, chief_operating_officer
| Self clock:  all authenticated users (any role)
|
| Employees self-service: /hr/attendance            → own records only
| HR management:          /hr/attendance            → full table (supervisor roles)
| Report:                 /hr/attendance/report     → monthly summary
*/

Route::middleware(['auth'])->group(function () {

    // ── Sidebar link: /attendance ─────────────────────────────────────────
    // Sidebar.jsx links to /attendance — redirect to the actual prefix.
    Route::get('attendance', function () {
        return redirect('/hr/attendance');
    })->name('attendance');

});

Route::middleware(['auth'])->prefix('hr/attendance')->name('attendance.')->group(function () {

    // ── Self-service (all users) ──────────────────────────────────────────
    Route::get('/', [AttendanceController::class, 'index'])->name('index');
    Route::post('/clock-in', [AttendanceController::class, 'clockIn'])->name('clock-in');
    Route::post('/clock-out', [AttendanceController::class, 'clockOut'])->name('clock-out');

    // ── Monthly report (finance_admin_supervisor + administrative_assistant + president) ──
    Route::get('/report', [AttendanceController::class, 'report'])->name('report');

    // ── Supervisor override — create/edit any record ──────────────────────
    Route::get('/create', [AttendanceController::class, 'create'])->name('create');
    Route::post('/', [AttendanceController::class, 'store'])->name('store');
    Route::get('/{attendance}', [AttendanceController::class, 'show'])->name('show');
    Route::get('/{attendance}/edit', [AttendanceController::class, 'edit'])->name('edit');
    Route::put('/{attendance}', [AttendanceController::class, 'update'])->name('update');
    Route::delete('/{attendance}', [AttendanceController::class, 'destroy'])->name('destroy');
});
