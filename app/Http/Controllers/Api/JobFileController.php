<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobFile;
use App\Models\JobCrm;
use App\Models\Tenant;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class JobFileController extends Controller
{
    /**
     * Set S3 configuration dynamically for the current tenant
     */
    private function setS3Config($tenant)
    {
        if (!$tenant->aws_access_key_id || !$tenant->aws_secret_access_key || !$tenant->aws_bucket_name) {
            return false;
        }

        $region = $tenant->aws_region ?? 'eu-central-1';

        Config::set('filesystems.disks.s3_tenant', [
            'driver' => 's3',
            'key'    => $tenant->aws_access_key_id,
            'secret' => $tenant->aws_secret_access_key,
            'region' => $region,
            'bucket' => $tenant->aws_bucket_name,
            'url'    => "https://{$tenant->aws_bucket_name}.s3.{$region}.amazonaws.com",
            'use_path_style_endpoint' => false,
            'throw'  => true,
        ]);

        return true;
    }

    /**
     * List all jobs with their files (for the global Files page)
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $jobs = JobCrm::where('tenant_id', $tenantId)
            ->with(['customer', 'jobFiles'])
            ->get()
            ->map(fn($j) => [
                'id'       => $j->id,
                'title'    => $j->title,
                'customer' => ['name' => $j->customer?->name],
                'jobfile'  => $j->jobFiles->map(fn($f) => [
                    'id'         => $f->id,
                    'fileName'   => $f->file_name,
                    'filePath'   => $f->file_path,
                    'fileType'   => $f->file_type,
                    'fileSize'   => $f->file_size,
                    'uploadedAt' => $f->uploaded_at,
                ])
            ]);

        return response()->json($jobs);
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
        $tenant = Tenant::find($user->tenant_id);

        $job = JobCrm::where('tenant_id', $tenant->id)->findOrFail($jobId);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path = "tenants/{$tenant->id}/jobs/{$job->id}/" . Str::uuid() . '_' . $fileName;

        if ($this->setS3Config($tenant)) {
            try {
                // Manually trigger a refresh of the storage manager if needed, 
                // though configured dynamically it should work.
                $s3Disk = Storage::disk('s3_tenant');
                $stream = fopen($file->getRealPath(), 'r+');
                $s3Disk->put($path, $stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
                $url = $s3Disk->url($path);
            } catch (\Exception $e) {
                \Log::error("Tenant S3 Upload Error: " . $e->getMessage());
                return response()->json(['message' => 'S3 Yükleme hatası: ' . $e->getMessage()], 500);
            }
        } else {
            // Fallback to local storage if S3 not configured
            Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));
            $url = Storage::disk('public')->url($path);
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

        ActivityLogService::log($user, 'CREATE', 'FILE', $jobFile->id, $job->title,
            "{$job->title} işine yeni bir dosya yüklendi: {$fileName}");

        return response()->json([
            'id'         => $jobFile->id,
            'fileName'   => $jobFile->file_name,
            'filePath'   => $jobFile->file_path,
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
        $tenant = Tenant::find($user->tenant_id);

        $jobFile = JobFile::whereHas('job', function ($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id);
        })->findOrFail($fileId);

        $job = $jobFile->job;

        if ($this->setS3Config($tenant)) {
            // Extract path from URL to delete from S3
            // Format: https://bucket.s3.region.amazonaws.com/path
            $urlPrefix = "https://{$tenant->aws_bucket_name}.s3.{$tenant->aws_region}.amazonaws.com/";
            if (Str::startsWith($jobFile->file_path, $urlPrefix)) {
                $path = Str::after($jobFile->file_path, $urlPrefix);
                try {
                    Storage::disk('s3_tenant')->delete($path);
                } catch (\Exception $e) {
                    \Log::error("S3 Delete failed: " . $e->getMessage());
                }
            }
        } else {
            // Try deleting from public disk if it's there
            $path = Str::after($jobFile->file_path, '/storage/');
            if ($path != $jobFile->file_path) {
                Storage::disk('public')->delete($path);
            }
        }

        // Decrease used storage
        $tenant->decrement('storage_used', $jobFile->file_size);

        ActivityLogService::log($user, 'DELETE', 'FILE', $jobFile->id, $job->title,
            "{$job->title} işinden \"{$jobFile->file_name}\" isimli dosya silindi.");

        $jobFile->delete();

        return response()->json(['message' => 'Dosya silindi.']);
    }

    /**
     * Helper to download or redirect to S3 URL
     */
    public function download(Request $request)
    {
        $fileId = $request->query('id');
        $tenantId = $request->user()->tenant_id;

        $jobFile = JobFile::whereHas('job', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($fileId);

        // Simple redirect to the stored full URL (S3 or local)
        return redirect($jobFile->file_path);
    }
}
