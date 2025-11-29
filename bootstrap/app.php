<?php

declare(strict_types=1);

use App\Console\Commands\ImportPurchaseDocuments;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withCommands([
        ImportPurchaseDocuments::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Redirect guests to login when authorization fails
        $exceptions->render(function (Illuminate\Auth\Access\AuthorizationException $e, Illuminate\Http\Request $request) {
            if (! $request->user()) {
                if ($request->expectsJson() || $request->header('X-Inertia')) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }

                return to_route('login');
            }
        });
    })->create();
