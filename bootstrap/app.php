<?php

use App\Http\Middleware\CheckBranch;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

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
            'role' => CheckRole::class,
            'branch' => CheckBranch::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Render Inertia error pages for authorization and not-found failures
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if (! $request->header('X-Inertia')) {
                return $response;
            }

            return match ($response->getStatusCode()) {
                403 => Inertia::render('Errors/403')
                    ->toResponse($request)
                    ->setStatusCode(403),
                404 => Inertia::render('Errors/404')
                    ->toResponse($request)
                    ->setStatusCode(404),
                default => $response,
            };
        });
    })->create();
