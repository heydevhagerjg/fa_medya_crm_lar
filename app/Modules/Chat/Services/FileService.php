<?php

namespace App\Modules\Chat\Services;

use App\Modules\Chat\Models\Message;
use App\Modules\Chat\Models\MessageAttachment;
use App\Models\Tenant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileService
{
    /**
     * Upload an attachment to tenant specific S3 disk and attach to message.
     */
    public function uploadMessageAttachment(
        Message $message,
        UploadedFile $file,
        ?string $uploaderId = null
    ): MessageAttachment {
        $uploaderId = $uploaderId ?? auth()->id();
        $tenantId = auth()->user()->tenant_id;

        // 1. Get dynamically configured S3 disk (set by TenantS3Middleware)
        $disk = \Illuminate\Support\Facades\Storage::disk('s3_global');

        // 2. Prepare storage path under tenant folder
        $date = now()->format('Y/m/d');
        $extension = $file->getClientOriginalExtension() ?: 'bin';
        $filename = "tenants/{$tenantId}/chat/attachments/{$date}/" . Str::uuid() . "." . $extension;

        // 3. Store file in S3
        $disk->put(
            $filename,
            file_get_contents($file),
            ['visibility' => 'private']
        );

        // 4. Create attachment record
        $attachment = $message->attachments()->create([
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $this->detectFileType($file),
            'file_size' => $file->getSize(),
            's3_path' => $filename,
            's3_url' => $disk->url($filename),
            'mime_type' => $file->getMimeType(),
        ]);

        // 5. Generate preview (async)
        if ($attachment->file_type === 'image') {
            \App\Modules\Chat\Jobs\GenerateFilePreviewJob::dispatch($attachment);
        }

        // 6. Update Tenant storage usage (base file only)
        $tenant = auth()->user()->tenant;
        if ($tenant) {
            $tenant->increment('storage_used', $file->getSize());
        }

        return $attachment;
    }

    /**
     * Get a signed URL for an attachment download.
     */
    public function getSignedUrl(MessageAttachment $attachment, ?int $expiresInSeconds = 3600): string
    {
        $tenantId = auth()->user()->tenant_id;
        $disk = Tenant::getS3DiskForTenant($tenantId);

        if (!$disk) {
            throw new \Exception("Tenant S3 configuration mismatch.");
        }

        return $disk->temporaryUrl(
            $attachment->s3_path,
            now()->addSeconds($expiresInSeconds)
        );
    }

    /**
     * Basic file type detection for the module.
     */
    protected function detectFileType(UploadedFile $file): string
    {
        $mime = $file->getMimeType();

        if (str_contains($mime, 'image')) return 'image';
        if ($mime === 'application/pdf') return 'pdf';
        if (str_contains($mime, 'video')) return 'video';
        if (str_contains($mime, 'text') || str_contains($mime, 'msword') || str_contains($mime, 'officedocument')) return 'document';

        return 'other';
    }

    /**
     * Delete an attachment and its files from S3.
     */
    public function deleteAttachment(MessageAttachment $attachment): bool
    {
        $message = $attachment->message;
        $chat = $message?->chat;
        
        // Use manual build since it might be a background job or admin action
        $disk = $chat ? Tenant::getS3DiskForTenant($chat->tenant_id) : \Illuminate\Support\Facades\Storage::disk('s3_global');

        if ($disk) {
            try {
                if ($disk->exists($attachment->s3_path)) {
                    $disk->delete($attachment->s3_path);

                    // Delete preview if exists
                    $previewPath = str_replace('attachments/', 'attachments/previews/', $attachment->s3_path);
                    if ($disk->exists($previewPath)) {
                        $disk->delete($previewPath);
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("S3 dosya silme başarısız: {$attachment->s3_path}", [
                    'error' => $e->getMessage(),
                    'attachment_id' => $attachment->id,
                ]);
            }
        }

        // Update Tenant storage usage (decrement only base file size)
        $tenant = $chat?->tenant;
        if ($tenant && $attachment->file_size > 0) {
            $tenant->decrement('storage_used', $attachment->file_size);
        }

        return $attachment->delete();
    }
}
