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
            // A) Tarih Kontrolü
            if ($apiKeyRecord->expires_at && $apiKeyRecord->expires_at->isPast()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bu API anahtarının kullanım süresi dolmuştur.'
                ], 401);
            }

            // B) Granüler İzin (Permission) Kontrolü
            if ($apiKeyRecord->permissions && count($apiKeyRecord->permissions) > 0) {
                // Mevcut metodun gerektirdiği aksiyonu belirleyelim
                $method = $request->method();
                $requiredAction = match ($method) {
                    'GET' => 'read',
                    'POST' => 'write',
                    'PUT', 'PATCH' => 'update',
                    'DELETE' => 'delete',
                    default => 'read'
                };

                $isAllowed = false;
                // Rotadaki modülü çekelim (api/jobs/1 veya auth/me gibi)
                // path() genellikle 'api/...' ile başlar
                $path = $request->path();
                $path = preg_replace('/^api\//', '', $path); 
                $pathParts = explode('/', $path);
                $targetModule = $pathParts[0] ?? ''; 

                if ($targetModule) {
                    // "module:action" veya "module:*" formatını kontrol edelim
                    $permissionToSEARCH = "$targetModule:$requiredAction";
                    $wildcardPermission = "$targetModule:*";

                    if (in_array($permissionToSEARCH, $apiKeyRecord->permissions) || in_array($wildcardPermission, $apiKeyRecord->permissions)) {
                        $isAllowed = true;
                    }
                }

                if (!$isAllowed) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "Bu işlem için yetkiniz bulunmamaktadır. Gerekli izin: $targetModule:$requiredAction"
                    ], 403);
                }
            }

            // Önce ADMIN rolündeki kullanıcıyı al, yoksa herhangi birini seç
            $user = \App\Models\User::where('tenant_id', $apiKeyRecord->tenant_id)
                ->where('role', 'ADMIN')
                ->where('is_approved', true)
                ->first()
                ?? \App\Models\User::where('tenant_id', $apiKeyRecord->tenant_id)
                    ->where('is_approved', true)
                    ->first();
            if ($user) {
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
