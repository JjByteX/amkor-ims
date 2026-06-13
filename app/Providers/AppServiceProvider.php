<?php

namespace App\Providers;

use App\Listeners\RecordLoginActivity;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Record login / logout to the activity log.
        // These events surface in the Dashboard Login Activity panel.
        Event::listen(Login::class,  RecordLoginActivity::class);
        Event::listen(Logout::class, RecordLoginActivity::class);
    }
}
