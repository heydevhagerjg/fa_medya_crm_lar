<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use App\Models\Tenant;

class TenantS3Middleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if ($user && $user->tenant_id) {
            $tenant = Tenant::with('s3Config')->find($user->tenant_id);
            
            if ($tenant && $tenant->s3Config) {
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
            }
        }

        return $next($request);
    }
}
