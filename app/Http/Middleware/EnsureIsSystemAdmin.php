<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsSystemAdmin
{
    /**
     * Admin panel rotalarını korur.
     * Yalnızca Admin modeli üzerinden oluşturulan ve 'admin' ability'sine sahip
     * Sanctum token'larına izin verir.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Kimlik doğrulama gereklidir.',
            ], 401);
        }

        // Admin modeli olup olmadığını kontrol et
        if (!($user instanceof \App\Models\Admin)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Bu alana erişim için sistem yöneticisi yetkisi gereklidir.',
            ], 403);
        }

        // Token'ın 'admin' ability'sine sahip olup olmadığını kontrol et
        if (!$user->tokenCan('admin')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Geçersiz yönetici token\'ı.',
            ], 403);
        }

        return $next($request);
    }
}
