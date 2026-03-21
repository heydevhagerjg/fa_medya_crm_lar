<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Sadece oturumu açık olan ve bir firmaya (tenant) bağlı olan kullanıcılar için kontrol et
        if ($user && $user->tenant_id) {
            $tenant = $user->tenant;

            if ($tenant && !$tenant->is_active) {
                // Mevcut oturum bilgilerini (token) temizleyerek "otomatik kapatma" sağla
                if ($user->currentAccessToken()) {
                    $user->currentAccessToken()->delete();
                }

                $msg = $tenant->suspension_message ?: 'Hesabınız yönetici tarafından geçici olarak askıya alınmıştır.';
                $msg .= ' Hata olduğunu düşünüyorsanız bizimle iletişime geçin.';
                
                return response()->json([
                    'status' => 'suspended',
                    'message' => $msg
                ], 403);
            }
        }

        return $next($request);
    }
}
