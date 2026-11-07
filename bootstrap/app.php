<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            \Illuminate\Support\Facades\Route::get('/manifest.webmanifest', function () {
                return response(file_get_contents(public_path('manifest.webmanifest')), 200, [
                    'Content-Type' => 'application/manifest+json',
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            })->name('pwa.manifest');

            \Illuminate\Support\Facades\Route::get('/manifest.json', function () {
                return response(file_get_contents(public_path('manifest.webmanifest')), 200, [
                    'Content-Type' => 'application/manifest+json',
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            })->name('pwa.manifest.alias');

            \Illuminate\Support\Facades\Route::get('/sw.js', function () {
                return response(file_get_contents(public_path('sw.js')), 200, [
                    'Content-Type' => 'application/javascript',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                ]);
            })->name('pwa.sw');

            \Illuminate\Support\Facades\Route::get('/offline.html', function () {
                return response(file_get_contents(public_path('offline.html')), 200, [
                    'Content-Type' => 'text/html; charset=UTF-8',
                    'Cache-Control' => 'public, max-age=3600',
                ]);
            })->name('pwa.offline');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Render exceptions as JSON for API-style routes and any request that
        // expects JSON (fetch/XHR endpoints like work-reports autosave).
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
