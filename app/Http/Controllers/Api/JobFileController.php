<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobFile;
use App\Models\JobCrm;
use App\Models\Tenant;
use App\Models\Admin;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class JobFileController extends Controller
{
    use HasTenantCache;

    private static $globalS3Disk = null;

    private function setGlobalS3Config()
    {
        if (self::$globalS3Disk !== null) {
            return true;
        }

        $tenant = request()->user()->tenant ?? null;
        if (!$tenant || !$tenant->s3Config || !$tenant->s3Config->is_active) {
            return false;
        }
        $config = $tenant->s3Config;

        if (!$config->aws_access_key_id || !$config->aws_secret_access_key || !$config->aws_bucket_name) {
            return false;
        }

        $region = strtolower(trim($config->aws_region ?? 'eu-central-1'));

        \Illuminate\Support\Facades\Storage::forgetDisk('s3_global');

        \Illuminate\Support\Facades\Config::set('filesystems.disks.s3_global', [
            'driver' => 's3',
            'key'    => trim($config->aws_access_key_id),
            'secret' => trim($config->aws_secret_access_key),
            'region' => $region,
            'bucket' => trim($config->aws_bucket_name),
            'use_path_style_endpoint' => false,
            'url_encode_filenames' => true,
            'throw'  => true,
            'version' => 'latest'
        ]);

        self::$globalS3Disk = 's3_global';
        return true;
    }

    /**
     * List all jobs with their files (for the global Files page)
     */
    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('files');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            $user = $request->user();
            $tenantId = $user->tenant_id;

            $query = JobCrm::where('tenant_id', $tenantId);
            // All users in the tenant can view files as per JobsPage rules

            return $query->with(['customer', 'jobFiles'])
                ->get()
                ->map(fn($j) => [
                    'id'       => $j->id,
                    'title'    => $j->title,
                    'customer' => ['name' => $j->customer?->name],
                    'jobfile'  => $j->jobFiles->map(fn($f) => [
                        'id'         => $f->id,
                        'fileName'   => $f->file_name,
                        'filePath'   => "/api/files/{$f->id}/download",
                        'fileType'   => $f->file_type,
                        'fileSize'   => $f->file_size,
                        'uploadedAt' => $f->uploaded_at,
                    ])
                ])->toArray();
        });

        return response()->json($data);
    }

    /**
     * Upload a file to S3
     */
    public function store(Request $request, $jobId = null): JsonResponse
    {
        // Job ID can be from URL or request body
        $jobId = $jobId ?? $request->jobId;

        $request->validate([
            'file' => 'required|file|max:51200', // 50MB
        ]);

        $user = $request->user();
        
        if ($user->role !== 'ADMIN' && !$user->can('files.upload')) {
            return response()->json(['message' => 'Oturum yetkiniz dosya yüklemek için yetersiz.'], 403);
        }
        
        $tenant = Tenant::find($user->tenant_id);

        if ($tenant->reachedDiskLimit()) {
            $limit = $tenant->plan_disk_usage_limit;
            return response()->json([
                'message' => "Dosya yükleme limitiniz (disk kotası: {$limit} MB) dolmuştur. Daha fazla dosya yüklemek için lütfen paketinizi yükseltiniz."
            ], 403);
        }

        $query = JobCrm::where('tenant_id', $tenant->id);
        if ($user->role !== 'ADMIN') {
            if (!$user->can('files.view_all')) {
                $query->where('user_id', $user->id);
            }
        }
        $job = $query->findOrFail($jobId);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path = "tenants/{$tenant->id}/jobs/{$job->id}/" . Str::uuid() . '_' . $fileName;

        if ($this->setGlobalS3Config()) {
            try {
                $s3Disk = Storage::disk('s3_global');
                $stream = fopen($file->getRealPath(), 'r+');
                $s3Disk->put($path, $stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
                // Store RELATIVE path instead of URL
                $url = $path;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Global S3 Upload Error: " . $e->getMessage());
                return response()->json(['message' => 'S3 Yükleme hatası: ' . $e->getMessage()], 500);
            }
        } else {
             return response()->json(['message' => 'Yöneticisin depolama ayarlarını kontrol etmeli (S3 Yapılandırılmamış).'], 400);
        }

        // Update used storage
        $tenant->increment('storage_used', $file->getSize());

        $jobFile = $job->jobFiles()->create([
            'file_name' => $fileName,
            'file_path' => $url,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_at' => now(),
        ]);

        $this->clearTenantCache('files');
        $this->clearTenantCache('jobs');

        ActivityLogService::log($user, 'CREATE', 'FILE', $jobFile->id, $job->title,
            "{$job->title} işine yeni bir dosya yüklendi: {$fileName}");

        return response()->json([
            'id'         => $jobFile->id,
            'fileName'   => $jobFile->file_name,
            'filePath'   => "/api/files/{$jobFile->id}/download",
            'fileType'   => $jobFile->file_type,
            'fileSize'   => $jobFile->file_size,
            'uploadedAt' => $jobFile->uploaded_at,
        ], 201);
    }

    /**
     * Delete a file from storage and database
     */
    public function destroy(Request $request, $jobId = null): JsonResponse
    {
        // For /files/{id} endpoint, jobId is actually the fileId
        // For /jobs/{jobId}/files endpoint, fileId is in the body
        $fileId = $request->input('fileId') ?? $jobId;
        
        $user = $request->user();
        
        if ($user->role !== 'ADMIN' && !$user->can('files.delete')) {
            return response()->json(['message' => 'Oturum yetkiniz bu dosyayı silmek için yetersiz.'], 403);
        }

        $tenant = Tenant::find($user->tenant_id);

        $jobFile = JobFile::whereHas('job', function ($q) use ($tenant, $user) {
            $q->where('tenant_id', $tenant->id);
            if ($user->role !== 'ADMIN') {
                if (!$user->can('files.view_all')) {
                    $q->where('user_id', $user->id);
                }
            }
        })->findOrFail($fileId);

        $job = $jobFile->job;

        if ($this->setGlobalS3Config()) {
            $admin = Admin::first();
            $urlPrefix = "https://{$admin->aws_bucket_name}.s3.{$admin->aws_region}.amazonaws.com/";
            if (Str::startsWith($jobFile->file_path, $urlPrefix)) {
                $path = Str::after($jobFile->file_path, $urlPrefix);
                try {
                    Storage::disk('s3_global')->delete($path);
                } catch (\Exception $e) {
                    \Log::error("Global S3 Delete failed: " . $e->getMessage());
                }
            }
        }

        // Decrease used storage
        $tenant->decrement('storage_used', $jobFile->file_size);

        ActivityLogService::log($user, 'DELETE', 'FILE', $jobFile->id, $job->title,
            "{$job->title} işinden \"{$jobFile->file_name}\" isimli dosya silindi.");

        $jobFile->delete();
        $this->clearTenantCache('files');
        $this->clearTenantCache('jobs');

        return response()->json(['message' => 'Dosya silindi.']);
    }

    /**
     * Helper to download or redirect to S3 URL
     */
    public function download(Request $request, $id = null)
    {
        $fileId = $id ?? $request->input('fileId') ?? $request->query('fileId');
        if (!$fileId) return response()->json(['message' => 'Dosya id bulunamadı'], 400);

        $user = $request->user();
        $tenantId = $user->tenant_id;
        
        $jobFile = JobFile::whereHas('job', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($fileId);

        if (!$this->setGlobalS3Config()) {
            abort(400, 'S3 Configuration missing');
        }

        $s3 = Storage::disk('s3_global');
        $path = $jobFile->file_path;

        // If it's a full URL, extract the path
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            $parsed = parse_url($path);
            $path = ltrim($parsed['path'] ?? '', '/');
            // Decode path because S3 expects raw path, but url might be encoded
            $path = urldecode($path);
        }

        if (!$s3->exists($path)) {
            \Log::warning("File not found on S3: {$path}");
            abort(404, 'Dosya depolama alanında bulunamadı.');
        }

        return $s3->response($path, $jobFile->file_name);
    }

}
