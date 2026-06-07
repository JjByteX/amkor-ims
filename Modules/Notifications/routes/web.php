<?php

use Illuminate\Support\Facades\Route;
use Modules\Notifications\Http\Controllers\NotificationsController;

Route::middleware(['auth'])->group(function () {
    Route::get('notifications', [NotificationsController::class, 'index'])->name('notifications.index');
    Route::post('notifications/read-all', [NotificationsController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('notifications/{notification}/read', [NotificationsController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/{notification}/archive', [NotificationsController::class, 'archive'])->name('notifications.archive');
    Route::delete('notifications/{notification}', [NotificationsController::class, 'destroy'])->name('notifications.destroy');
});
