<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Request;

trait HasTenantCache
{
    /**
     * Boot the trait to clear cache on model events
     */
    protected static function bootHasTenantCache()
    {
        static::saved(function ($model) {
            $model->clearModelCache();
        });

        static::deleted(function ($model) {
            $model->clearModelCache();
        });
    }

    /**
     * Internal helper to clear model-specific cache
     */
    protected function clearModelCache()
    {
        $module = property_exists($this, 'cacheModule') ? $this->cacheModule : $this->getTable();
        $tenantId = $this->tenant_id ?? (auth()->check() ? auth()->user()->tenant_id : null);
        
        if ($tenantId) {
            $this->clearTenantCache($module, $tenantId);
            
            if (property_exists($this, 'relatedCacheModules')) {
                foreach ($this->relatedCacheModules as $relModule) {
                    $this->clearTenantCache($relModule, $tenantId);
                }
            }
        }
    }

    /**
     * Get the cache TTL in seconds from .env
     */
    protected function getCacheTTL(): int
    {
        $hours = (int) config('cache.tenant_ttl_hours', 24);
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
    protected function clearTenantCache(string $module, ?string $tenantId = null): void
    {
        $tenantId = $tenantId ?? (auth()->check() ? auth()->user()->tenant_id : null);
        
        if (!$tenantId) {
            return;
        }

        $key = "tenant_{$tenantId}_{$module}_version";
        
        $current = Cache::get($key, 1);
        Cache::forever($key, (int)$current + 1);
    }
}
