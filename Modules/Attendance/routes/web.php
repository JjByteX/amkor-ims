<?php

use Illuminate\Support\Facades\Route;
use Modules\Attendance\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| Attendance Module Routes
|--------------------------------------------------------------------------
|
| View all:    hr_admin_officer, general_manager, admin_auditor
| Manage/edit: hr_admin_officer, general_manager
| Self clock:  all authenticated users (any role)
|
| Employees self-service: /hr/attendance            → own records only
| HR management:          /hr/attendance            → full table (HR roles)
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
    Route::get('/',           [AttendanceController::class, 'index'])->name('index');
    Route::post('/clock-in',  [AttendanceController::class, 'clockIn'])->name('clock-in');
    Route::post('/clock-out', [AttendanceController::class, 'clockOut'])->name('clock-out');

    // ── Monthly report (HR + Auditor + JRT) ──────────────────────────────
    Route::get('/report', [AttendanceController::class, 'report'])->name('report');

    // ── HR override — create/edit any record ──────────────────────────────
    Route::get('/create',          [AttendanceController::class, 'create'])->name('create');
    Route::post('/',               [AttendanceController::class, 'store'])->name('store');
    Route::get('/{attendance}',    [AttendanceController::class, 'show'])->name('show');
    Route::get('/{attendance}/edit',[AttendanceController::class, 'edit'])->name('edit');
    Route::put('/{attendance}',    [AttendanceController::class, 'update'])->name('update');
    Route::delete('/{attendance}', [AttendanceController::class, 'destroy'])->name('destroy');
});
