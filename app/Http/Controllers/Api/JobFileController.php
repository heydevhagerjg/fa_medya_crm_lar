<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobFile;
use App\Models\JobCrm;
use App\Models\Tenant;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use App\Traits\S3GlobalConfigTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class JobFileController extends Controller
{
    use HasTenantCache, S3GlobalConfigTrait;

    private static $globalS3Disk = null;

    /**
     * Display a listing of files for the tenant
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $cacheKey = $this->getTenantCacheKey('files');

        return Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($user) {
            $query = JobCrm::with(['jobfile', 'customer:id,name'])
                ->where('tenant_id', $user->tenant_id)
                ->whereHas('jobfile')
                ->when($user->role !== 'ADMIN' && !$user->can('files.view_all'), function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });

            return response()->json($query->orderBy('title', 'asc')->get());
        });
    }

    /**
     * Store newly uploaded files
     */
    public function store(Request $request, $id = null): JsonResponse
    {
        $jobId = $id ?? $request->input('job_id') ?? $request->input('jobId');
        if (!$jobId) return response()->json(['message' => 'İş id bulunamadı'], 400);

        $user = $request->user();
        $job = JobCrm::where('tenant_id', $user->tenant_id)->findOrFail($jobId);

        if ($user->role !== 'ADMIN' && !$user->can('files.upload')) {
            return response()->json(['message' => 'Oturum yetkiniz dosya yüklemek için yetersiz.'], 403);
        }

        $files = [];
        if ($request->hasFile('files')) {
            $files = $request->file('files');
            if (!is_array($files)) $files = [$files];
        } elseif ($request->hasFile('file')) {
            $files = [$request->file('file')];
        }

        if (count($files) === 0) {
            return response()->json(['message' => 'Dosya bulunamadı'], 400);
        }

        $tenant = Tenant::find($user->tenant_id);

        if (!$this->setGlobalS3Config()) {
            return response()->json(['message' => 'S3 Yapılandırması hatası.'], 400);
        }

        $uploadedCount = 0;

        foreach ($files as $file) {
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();

            // Dynamic limit check from tenant
            $maxLimit = ($tenant->plan_single_file_limit ?: 50) * 1024 * 1024;
            if ($fileSize > $maxLimit) {
                continue;
            }

            // Global quota check
            if (!$tenant->canUploadFile($fileSize)) {
                continue;
            }

            $path = "tenants/{$tenant->id}/jobs/{$job->id}/" . Str::random(10) . '_' . $fileName;

            try {
                Storage::disk('s3_global')->put($path, file_get_contents($file));
                $url = Storage::disk('s3_global')->url($path);

                JobFile::create([
                    'job_id' => $job->id,
                    'file_name' => $fileName,
                    'file_path' => $url,
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $fileSize,
                ]);

                $tenant->increment('storage_used', $fileSize);
                $uploadedCount++;

                ActivityLogService::log($user, 'CREATE', 'FILE', null, $job->title,
                    "{$job->title} işine \"{$fileName}\" isimli dosya yüklendi.");

            } catch (\Exception $e) {
                Log::error("File upload failed: " . $e->getMessage());
            }
        }

        $this->clearTenantCache('files');
        $this->clearTenantCache('jobs');

        return response()->json([
            'message' => "{$uploadedCount} dosya başarıyla yüklendi.",
            'count' => $uploadedCount
        ]);
    }

    /**
     * Remove the specified file (Soft Delete)
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $fileId = $id;
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

        ActivityLogService::log($user, 'DELETE', 'FILE', $jobFile->id, $job->title,
            "{$job->title} işinden \"{$jobFile->file_name}\" isimli dosya çöp kutusuna taşındı.");

        $jobFile->delete(); // Soft Delete
        $this->clearTenantCache('files');
        $this->clearTenantCache('jobs');

        return response()->json(['message' => 'Dosya çöp kutusuna taşındı.']);
    }

    /**
     * List trashed files
     */
    public function trash(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $files = JobFile::onlyTrashed()
            ->with('job:id,title')
            ->whereHas('job', function ($q) use ($tenantId, $user) {
                $q->where('tenant_id', $tenantId);
                if ($user->role !== 'ADMIN' && !$user->can('files.view_all')) {
                    $q->where('user_id', $user->id);
                }
            })->get();

        return response()->json($files);
    }

    /**
     * Restore a trashed file
     */
    public function restore(Request $request, $id)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $jobFile = JobFile::onlyTrashed()->whereHas('job', function ($q) use ($tenantId, $user) {
            $q->where('tenant_id', $tenantId);
            if ($user->role !== 'ADMIN') {
                if (!$user->can('files.view_all')) {
                    $q->where('user_id', $user->id);
                }
            }
        })->findOrFail($id);

        $jobFile->restore();
        $this->clearTenantCache('files');

        return response()->json(['message' => 'Dosya geri yüklendi.']);
    }

    /**
     * Permanently delete a file
     */
    public function forceDelete(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'ADMIN' && !$user->can('files.delete')) {
            return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $tenant = Tenant::find($user->tenant_id);

        $jobFile = JobFile::withTrashed()->whereHas('job', function ($q) use ($tenant, $user) {
            $q->where('tenant_id', $tenant->id);
            if ($user->role !== 'ADMIN') {
                if (!$user->can('files.view_all')) {
                    $q->where('user_id', $user->id);
                }
            }
        })->findOrFail($id);

        $job = $jobFile->job;

        if ($this->setGlobalS3Config()) {
            $path = $jobFile->file_path;

            if (filter_var($path, FILTER_VALIDATE_URL)) {
                $parsed = parse_url($path);
                $path = ltrim($parsed['path'] ?? '', '/');
                $path = urldecode($path);
            }

            try {
                Storage::disk('s3_global')->delete($path);
            } catch (\Exception $e) {
                Log::error("Force Delete: S3 Delete failed for file {$jobFile->id}: " . $e->getMessage());
            }
        }

        $tenant->decrement('storage_used', $jobFile->file_size);
        $jobFile->forceDelete();

        $this->clearTenantCache('files');
        $this->clearTenantCache('jobs');

        return response()->json(['message' => 'Dosya kalıcı olarak silindi.']);
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

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            $parsed = parse_url($path);
            $path = ltrim($parsed['path'] ?? '', '/');
            $path = urldecode($path);
        }

        if (!$s3->exists($path)) {
            Log::warning("File not found on S3: {$path}");
            abort(404, 'Dosya depolama alanında bulunamadı.');
        }

        return $s3->response($path, $jobFile->file_name);
    }
}
