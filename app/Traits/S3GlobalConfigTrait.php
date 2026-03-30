<?php

namespace App\Traits;

use Illuminate\Support\Facades\Config;
use App\Models\S3Config;

trait S3GlobalConfigTrait
{
    /**
     * Configure the global S3 disk for temporary operations
     *
     * @return bool
     */
    protected function setGlobalS3Config($tenantId = null): bool
    {
        if (!$tenantId) {
            $tenantId = auth()->user()->tenant_id ?? null;
        }
        
        if (!$tenantId && property_exists($this, 'tenantId')) {
            $tenantId = $this->tenantId;
        }

        if (!$tenantId) return false;

        $tenant = \App\Models\Tenant::with('s3Config')->find($tenantId);
        if (!$tenant || !$tenant->s3Config) return false;

        $s3 = $tenant->s3Config;

        Config::set('filesystems.disks.s3_global', [
            'driver' => 's3',
            'key' => trim($s3->aws_access_key_id),
            'secret' => trim($s3->aws_secret_access_key),
            'region' => trim($s3->aws_region),
            'bucket' => trim($s3->aws_bucket_name),
            'url' => $s3->public_url ? rtrim(trim($s3->public_url), '/') : null,
            'endpoint' => $s3->aws_endpoint ? trim($s3->aws_endpoint) : null,
            'use_path_style_endpoint' => (bool)($s3->use_path_style_endpoint ?? false),
            'throw' => false,
            'version' => 'latest'
        ]);

        return true;
    }
}
