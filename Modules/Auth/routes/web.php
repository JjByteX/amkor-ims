<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| Auth Module Routes
|--------------------------------------------------------------------------
| Login and logout only. No registration, no password reset.
| Auth middleware is NOT applied to login routes.
|--------------------------------------------------------------------------
*/

// Guest-only routes (redirect to dashboard if already logged in)
Route::middleware(['guest'])->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login'); // 'login' required by Laravel's auth middleware
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login.submit');
});

// Authenticated only
Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
});
