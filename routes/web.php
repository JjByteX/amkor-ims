<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// Root → redirect to dashboard (AppShell handles the login guard)
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Dashboard — protected, all authenticated roles
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
});
