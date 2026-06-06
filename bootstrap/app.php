<?php

use App\Http\Middleware\CheckBranch;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Inertia — must run on every web request
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        // Named middleware aliases — used in routes and controllers
        $middleware->alias([
            'role'   => CheckRole::class,
            'branch' => CheckBranch::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Render Inertia 403 for authorization failures
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $e, Request $request) {
            if ($response->getStatusCode() === 403 && $request->header('X-Inertia')) {
                return Inertia::render('Errors/403')
                    ->toResponse($request)
                    ->setStatusCode(403);
            }

            return $response;
        });
    })->create();
