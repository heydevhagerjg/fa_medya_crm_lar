<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobFile;
use App\Models\JobCrm;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class JobFileController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $request->validate([
            'jobId' => 'required|integer',
            'file'  => 'required|file|max:51200', // 50MB
        ]);

        $job = JobCrm::where('tenant_id', $tenantId)->findOrFail($request->jobId);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path = "crm/{$tenantId}/job-{$job->id}/" . Str::uuid() . '-' . $fileName;

        // Store file - use local storage or S3 depending on config
        Storage::disk(config('filesystems.default'))->put($path, file_get_contents($file));
        $url = Storage::disk(config('filesystems.default'))->url($path);

        // Update used storage
        $job->tenant->increment('used_storage', $file->getSize());

        $jobFile = JobFile::create([
            'job_id'      => $job->id,
            'file_name'   => $fileName,
            'file_path'   => $url,
            'file_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'uploaded_at' => now(),
        ]);

        ActivityLogService::log($request->user(), 'CREATE', 'FILE', $jobFile->id, $job->title,
            "{$job->title} işine yeni bir dosya yüklendi: {$fileName}");

        return response()->json($jobFile, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $jobFile = JobFile::whereHas('job', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        $job = $jobFile->job;

        // Decrease used storage
        $job->tenant->decrement('used_storage', $jobFile->file_size);

        ActivityLogService::log($request->user(), 'DELETE', 'FILE', $jobFile->id, $job->title,
            "{$job->title} işinden \"{$jobFile->file_name}\" isimli dosya silindi.");

        $jobFile->delete();

        return response()->json(['message' => 'Dosya silindi.']);
    }
}
