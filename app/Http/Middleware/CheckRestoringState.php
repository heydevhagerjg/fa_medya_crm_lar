<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRestoringState
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow check status route
        if ($request->is('api/auth/me')) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && $user->tenant_id) {
            $tenant = \App\Models\Tenant::find($user->tenant_id);
            if ($tenant && $tenant->is_restoring) {
                return response()->json([
                    'status' => 'restoring',
                    'message' => 'Yedekten geri dönülüyor... Lütfen bekleyin.'
                ], 423); // 423 Locked
            }
        }

        return $next($request);
    }
}
