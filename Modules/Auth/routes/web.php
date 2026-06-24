<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\Http\Controllers\AuthController;
use Modules\Auth\Http\Controllers\BranchSessionController;

/*
|--------------------------------------------------------------------------
| Auth Module Routes
|--------------------------------------------------------------------------
*/

// Guest-only routes
Route::middleware(['guest'])->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login.submit');

    // Password reset
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('auth.password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('auth.password.email');
});

// Authenticated only
Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');

    // Gap 8 — Global branch switcher: stores active_branch_id in the session.
    // POST sets the active branch (view + create context).
    // GET returns the current active branch as JSON (used by create forms to show confirmation banner).
    // Only accessible to the four all-access roles; the controller enforces this.
    Route::post('/session/branch', [BranchSessionController::class, 'store'])->name('session.branch');
    Route::get('/session/branch',  [BranchSessionController::class, 'show'])->name('session.branch.show');
});
