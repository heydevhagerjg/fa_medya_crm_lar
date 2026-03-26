<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($request->user()->tenant_id);
        
        return response()->json([
            'id'    => $tenant->id,
            'name'  => $tenant->name,
            'slug'  => $tenant->slug,
            'import_key'            => $tenant->import_key,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($request->user()->tenant_id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'import_key'            => 'nullable|string|max:255',
        ]);

        $tenant->update($validated);

        return response()->json(['message' => 'Ayarlar güncellendi.', 'tenant' => $tenant]);
    }

    /**
     * Get general information for the tenant
     */
    public function getGeneralInfo(Request $request): JsonResponse
    {
        try {
            $tenant = Tenant::findOrFail($request->user()->tenant_id);
            
            return response()->json([
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'address' => $tenant->address,
                'website' => $tenant->website,
                'logo' => $tenant->logo,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting tenant info', [
                'message' => $e->getMessage(),
                'user_id' => $request->user()->id,
                'tenant_id' => $request->user()->tenant_id
            ]);
            return response()->json([
                'message' => 'Hata: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update general information for the tenant
     */
    public function updateGeneralInfo(Request $request): JsonResponse
    {
        try {
            $tenant = Tenant::findOrFail($request->user()->tenant_id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'website' => 'nullable|string|max:255|url',
            ]);

            $tenant->update($validated);

            return response()->json([
                'message' => 'Genel bilgiler güncellendi.',
                'data' => [
                    'name' => $tenant->name,
                    'email' => $tenant->email,
                    'phone' => $tenant->phone,
                    'address' => $tenant->address,
                    'website' => $tenant->website,
                    'logo' => $tenant->logo,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Error updating tenant', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Hata: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload and update tenant logo
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $tenant = Tenant::with('s3Config')->findOrFail($request->user()->tenant_id);

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,gif,webp|max:5120',
        ]);

        try {
            \Log::info('Starting logo upload', [
                'tenant_id' => $tenant->id,
                'has_s3_config' => !!$tenant->s3Config
            ]);

            // Ensure S3 disk is configured for this tenant
            if (!$tenant->s3Config) {
                throw new \Exception('Tenant S3 configuration not found.');
            }

            $s3Config = $tenant->s3Config;
            
            // Configure S3 disk with tenant credentials
            \Illuminate\Support\Facades\Config::set('filesystems.disks.s3', [
                'driver' => 's3',
                'key' => trim($s3Config->aws_access_key_id),
                'secret' => trim($s3Config->aws_secret_access_key),
                'region' => trim($s3Config->aws_region),
                'bucket' => trim($s3Config->aws_bucket_name),
                'endpoint' => $s3Config->aws_endpoint ? trim($s3Config->aws_endpoint) : null,
                'use_path_style_endpoint' => (bool)($s3Config->use_path_style_endpoint ?? false),
                'throw' => true,
                'report' => true,
            ]);

            $disk = \Illuminate\Support\Facades\Storage::disk('s3');

            // Delete old logo if exists
            if ($tenant->logo) {
                \Log::info('Deleting old logo', ['logo' => $tenant->logo]);
                try {
                    // Extract key from URL if it's a full URL
                    $logoPath = $tenant->logo;
                    if (str_starts_with($logoPath, 'http')) {
                        // Extract path from URL
                        $parts = parse_url($logoPath);
                        $logoPath = ltrim($parts['path'], '/');
                        if (str_starts_with($logoPath, $s3Config->aws_bucket_name . '/')) {
                            $logoPath = substr($logoPath, strlen($s3Config->aws_bucket_name) + 1);
                        }
                    }
                    $disk->delete($logoPath);
                } catch (\Exception $e) {
                    \Log::warning('Could not delete old logo: ' . $e->getMessage());
                }
            }

            // Upload new logo
            $file = $request->file('logo');
            $filename = \Illuminate\Support\Str::random(32) . '.' . $file->getClientOriginalExtension();
            $path = "tenants/{$tenant->id}/logo/" . $filename;
            
            \Log::info('Uploading logo file', [
                'path' => $path,
                'file_size' => $file->getSize(),
                'file_mime' => $file->getMimeType(),
                'bucket' => $s3Config->aws_bucket_name,
                'region' => $s3Config->aws_region
            ]);

            $fileContent = file_get_contents($file);
            if (!$fileContent) {
                throw new \Exception('Could not read file content.');
            }

            // Upload to S3 (bucket has ACLs disabled, so just upload)
            $result = $disk->put($path, $fileContent);
            \Log::info('S3 put result', ['result' => var_export($result, true), 'path' => $path]);

            if (!$result) {
                throw new \Exception('S3 upload failed - put() returned false.');
            }

            // Generate permanent public URL using signed URL (max 7 days for AWS SigV4)
            // After 7 days expires, use backend endpoint for renewal
            try {
                $logoUrl = $disk->temporaryUrl($path, now()->addDays(7));
                \Log::info('Logo signed URL generated', ['logoUrl' => $logoUrl, 'expires_in_days' => 7]);
            } catch (\Exception $urlE) {
                \Log::error('Error generating signed URL', ['message' => $urlE->getMessage()]);
                // Fallback: use backend endpoint that generates fresh signed URLs
                $logoUrl = route('api.public.logo', ['tenantId' => $tenant->id, 'path' => $path]);
                \Log::info('Using backend logo endpoint', ['logoUrl' => $logoUrl]);
            }

            $tenant->update(['logo' => $logoUrl]);

            return response()->json([
                'message' => 'Logo successfully uploaded.',
                'logo' => $logoUrl,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Logo upload error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'class' => get_class($e)
            ]);
            return response()->json([
                'message' => 'Logo upload error: ' . $e->getMessage(),
            ], 500);
        }
    }

     /**
      * Test S3 connection
      */
     public function testConnection(Request $request): JsonResponse
     {
         try {
             $tenant = Tenant::findOrFail($request->user()->tenant_id);
             
             if (!$tenant->s3Config) {
                 return response()->json([
                     'message' => 'S3 yapılandırması bulunamadı.',
                     'success' => false
                 ], 400);
             }

             $disk = Tenant::getS3DiskForTenant($tenant->id);
             if (!$disk) {
                 throw new \Exception('Disk konfigürasyonu başarısız');
             }

             // Try to create and delete a test file
             $testPath = "tenants/{$tenant->id}/.test";
             $disk->put($testPath, 'test');
             $disk->delete($testPath);

             return response()->json([
                 'message' => 'S3 bağlantısı başarılı.',
                 'success' => true
             ]);
         } catch (\Exception $e) {
             return response()->json([
                 'message' => 'S3 bağlantı hatası: ' . $e->getMessage(),
                 'success' => false
             ], 500);
         }
     }

     /**
      * Serve tenant logo with fresh signed URL
      * Accessible by authenticated users only
      */
     public function serveLogo(Request $request, string $tenantId): \Symfony\Component\HttpFoundation\StreamedResponse
     {
         try {
             $tenant = Tenant::with('s3Config')->findOrFail($tenantId);
             
             if (!$tenant->logo) {
                 return response()->file(public_path('images/placeholder-logo.png'));
             }

             // Extract path from logo URL
             $logoPath = $tenant->logo;
             if (str_starts_with($logoPath, 'http')) {
                 $parts = parse_url($logoPath);
                 $logoPath = ltrim($parts['path'], '/');
                 if (str_starts_with($logoPath, $tenant->s3Config->aws_bucket_name . '/')) {
                     $logoPath = substr($logoPath, strlen($tenant->s3Config->aws_bucket_name) + 1);
                 }
             }

             // Configure disk
             \Illuminate\Support\Facades\Config::set('filesystems.disks.s3', [
                 'driver' => 's3',
                 'key' => trim($tenant->s3Config->aws_access_key_id),
                 'secret' => trim($tenant->s3Config->aws_secret_access_key),
                 'region' => trim($tenant->s3Config->aws_region),
                 'bucket' => trim($tenant->s3Config->aws_bucket_name),
                 'endpoint' => $tenant->s3Config->aws_endpoint ? trim($tenant->s3Config->aws_endpoint) : null,
                 'use_path_style_endpoint' => (bool)($tenant->s3Config->use_path_style_endpoint ?? false),
             ]);

             $disk = Storage::disk('s3');
             
             if (!$disk->exists($logoPath)) {
                 return response()->file(public_path('images/placeholder-logo.png'));
             }

             return response()->file($disk->path($logoPath), [
                 'Content-Type' => $disk->mimeType($logoPath),
                 'Cache-Control' => 'public, max-age=86400',
             ]);
         } catch (\Exception $e) {
             \Log::error('Logo serve error', ['error' => $e->getMessage()]);
             return response()->file(public_path('images/placeholder-logo.png'));
         }
     }
}

