<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiKey
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Zaten Sanctum ile giriş yapılmışsa devam et
        if ($request->user()) {
            return $next($request);
        }

        // 2. Anahtarı oku
        $key = $request->header('X-API-Key') ?: $request->header('x-api-key');

        if (!$key) {
             return $next($request);
        }

        // 3. Veritabanında ara
        $apiKeyRecord = \App\Models\ApiKey::where('key', $key)->first();

        if ($apiKeyRecord) {
            $user = \App\Models\User::where('tenant_id', $apiKeyRecord->tenant_id)->first();
            if ($user) {
                // Son kullanım tarihini sessizce güncelle
                \App\Models\ApiKey::where('id', $apiKeyRecord->id)->update(['last_used' => now()]);
                
                $request->setUserResolver(fn () => $user);
                auth()->login($user); 
                auth('sanctum')->setUser($user);
                return $next($request);
            }
        }

        return $next($request);
    }
}
