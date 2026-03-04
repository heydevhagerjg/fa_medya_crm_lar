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
            'aws_access_key_id'     => $tenant->aws_access_key_id,
            'aws_secret_access_key' => $tenant->aws_secret_access_key,
            'aws_region'            => $tenant->aws_region,
            'aws_bucket_name'       => $tenant->aws_bucket_name,
            'import_key'            => $tenant->import_key,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($request->user()->tenant_id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'aws_access_key_id'     => 'nullable|string|max:255',
            'aws_secret_access_key' => 'nullable|string|max:255',
            'aws_region'            => 'nullable|string|max:255',
            'aws_bucket_name'       => 'nullable|string|max:255',
            'import_key'            => 'nullable|string|max:255',
        ]);

        $tenant->update($validated);

        return response()->json(['message' => 'Ayarlar güncellendi.', 'tenant' => $tenant]);
    }

    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'aws_access_key_id'     => 'required|string',
            'aws_secret_access_key' => 'required|string',
            'aws_region'            => 'required|string',
            'aws_bucket_name'       => 'required|string',
        ]);

        // Temporarily configure S3
        $diskName = 's3_test_' . Str::random(8);
        Config::set("filesystems.disks.{$diskName}", [
            'driver' => 's3',
            'key'    => $validated['aws_access_key_id'],
            'secret' => $validated['aws_secret_access_key'],
            'region' => $validated['aws_region'],
            'bucket' => $validated['aws_bucket_name'],
            'url'    => "https://{$validated['aws_bucket_name']}.s3.{$validated['aws_region']}.amazonaws.com",
            'use_path_style_endpoint' => false,
            'throw'  => true,
        ]);

        try {
            $disk = Storage::disk($diskName);
            
            // 1. Test List Permission
            $disk->files();

            // 2. Test Write/Delete Permission
            $testPath = 'connection_test_' . Str::random(8) . '.txt';
            $disk->put($testPath, 'CRM Connection Test');
            $disk->delete($testPath);

            return response()->json([
                'success' => true, 
                'message' => 'Bağlantı başarılı! Listeleyebilir, dosya yükleyebilir ve silebilirsiniz.'
            ]);
        } catch (\Exception $e) {
            $message = $e->getMessage();
            
            if (str_contains($message, '403 Forbidden')) {
                $message = "Erişim reddedildi (403). Lütfen IAM yetkilerinizi kontrol edin (ListObjects, PutObject, DeleteObject yetkileri gereklidir).";
            } else if (str_contains($message, '404 Not Found')) {
                $message = "Bucket bulunamadı (404). Lütfen bucket ismini kontrol edin.";
            } else if (str_contains($message, 'CredentialsEvents')) {
                $message = "Kimlik bilgileri hatalı. Lütfen Access Key ve Secret Key bilgilerinizi kontrol edin.";
            }

            return response()->json([
                'success' => false, 
                'message' => 'Bağlantı hatası: ' . $message
            ], 400);
        }
    }
}
