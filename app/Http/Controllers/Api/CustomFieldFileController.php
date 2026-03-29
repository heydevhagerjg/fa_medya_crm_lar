<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class CustomFieldFileController extends Controller
{
    use HasTenantCache;

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200',
        ]);

        $user   = $request->user();
        $tenant = $user->tenant;
        $file   = $request->file('file');

        $fileName = $file->getClientOriginalName();
        $fileSize = $file->getSize();

        $maxLimit = ($tenant->plan_single_file_limit ?: 50) * 1024 * 1024;
        if ($fileSize > $maxLimit) {
            return response()->json(['message' => 'Dosya boyutu limitini aşıyor.'], 422);
        }

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar', 'svg', 'webp', 'mp4', 'mp3', 'psd', 'ai', 'eps', 'csv', 'stl', 'obj', 'ply', 'dcm'];
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions)) {
            return response()->json(['message' => 'Bu dosya uzantısı desteklenmiyor.'], 422);
        }

        if (!$tenant->canUploadFile($fileSize)) {
            return response()->json(['message' => 'Depolama kotanız yetersiz.'], 422);
        }

        $path = "tenants/{$tenant->id}/custom-fields/" . Str::random(10) . '_' . $fileName;

        try {
            Storage::disk('s3_global')->put($path, file_get_contents($file));
            $url = Storage::disk('s3_global')->url($path);

            $tenant->increment('storage_used', $fileSize);

            return response()->json([
                'url'  => $url,
                'path' => $path,
                'name' => $fileName,
                'size' => $fileSize,
            ]);
        } catch (\Exception $e) {
            Log::error('Custom field file upload failed: ' . $e->getMessage());
            return response()->json(['message' => 'Dosya yüklenirken hata oluştu.'], 500);
        }
    }

    /**
     * S3'teki dosya için signed URL döndürür veya dosyayı stream eder.
     */
    public function download(Request $request): JsonResponse
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $user   = $request->user();
        $tenant = $user->tenant;
        $path   = $request->input('path');

        // Güvenlik: Sadece kendi tenant'ının dosyalarına erişebilsin
        if (!str_starts_with($path, "tenants/{$tenant->id}/")) {
            return response()->json(['message' => 'Yetkisiz erişim.'], 403);
        }

        $disk = Storage::disk('s3_global');

        if (!$disk->exists($path)) {
            return response()->json(['message' => 'Dosya bulunamadı.'], 404);
        }

        try {
            $signedUrl = $disk->temporaryUrl($path, now()->addHour());
            return response()->json(['url' => $signedUrl]);
        } catch (\Exception $e) {
            Log::error('Custom field file signed URL failed: ' . $e->getMessage());
            return response()->json(['message' => 'Dosya URL oluşturulamadı.'], 500);
        }
    }
}
