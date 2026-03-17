<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Request;

trait HasTenantCache
{
    /**
     * Get the cache TTL in seconds from .env
     */
    protected function getCacheTTL(): int
    {
        $hours = (int) env('CACHE_TTL_HOURS', 24);
        return $hours * 3600;
    }

    /**
     * Generate a unique cache key for the tenant and module
     */
    protected function getTenantCacheKey(string $module, array $extraParams = []): string
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;
        $version = $this->getTenantCacheVersion($tenantId, $module);
        
        $params = array_merge(\Illuminate\Support\Facades\Request::all(), $extraParams);
        
        // Ek güvenlik: Eğer kullanıcının tüm veriyi görme yetkisi yoksa,
        // önbelleğin yetkililerle ya da başka personellerle karışmaması için 
        // kendi kullanıcı ID'sini görünürlük kapsamına ekliyoruz.
        $visibilityScope = 'all';
        if ($user->role !== 'ADMIN' && !$user->can($module . '.view_all')) {
            $visibilityScope = 'user_' . $user->id;
        }
        $params['_visibility_scope'] = $visibilityScope;

        ksort($params);
        $paramHash = md5(json_encode($params));

        return "tenant_{$tenantId}_{$module}_v{$version}_{$paramHash}";
    }

    /**
     * Get current version of the cache for this module/tenant
     */
    protected function getTenantCacheVersion(string $tenantId, string $module): int
    {
        return Cache::rememberForever("tenant_{$tenantId}_{$module}_version", fn() => 1);
    }

    /**
     * Clear the cache for a specific module by incrementing the version
     */
    protected function clearTenantCache(string $module): void
    {
        $tenantId = auth()->user()->tenant_id;
        $key = "tenant_{$tenantId}_{$module}_version";
        
        $current = Cache::get($key, 1);
        Cache::forever($key, $current + 1);
    }
}
