<?php

use Illuminate\Support\Facades\Route;

// Root → redirect to dashboard (AppShell handles the login guard)
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Dashboard — protected, all authenticated roles
Route::middleware(['auth'])->group(function () {
    Route::inertia('/dashboard', 'Dashboard')->name('dashboard');
});
