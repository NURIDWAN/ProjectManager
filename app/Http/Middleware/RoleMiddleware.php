<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * @deprecated Use \Spatie\Permission\Middleware\RoleMiddleware instead.
 *
 * This custom middleware has been replaced by Spatie Laravel Permission's built-in
 * RoleMiddleware. The 'role' alias in bootstrap/app.php now points to the Spatie
 * middleware. This file is retained for backward compatibility reference only
 * and is no longer registered in the application.
 */
class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Allowed roles for this route
     *
     * @deprecated Use Spatie\Permission\Middleware\RoleMiddleware instead.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        trigger_error(
            'App\Http\Middleware\RoleMiddleware is deprecated. Use Spatie\Permission\Middleware\RoleMiddleware instead.',
            E_USER_DEPRECATED
        );

        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            abort(403, 'Unauthorized. You do not have the required role to access this resource.');
        }

        return $next($request);
    }
}
