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

        // 1. Get tenant specific S3 disk
        $disk = Tenant::getS3DiskForTenant($tenantId);

        if (!$disk) {
            throw new \Exception("Tenant S3 configuration mismatch for tenant: {$tenantId}");
        }

        // 2. Prepare storage path
        $date = now()->format('Y/m/d');
        $extension = $file->getClientOriginalExtension() ?: 'bin';
        $filename = "attachments/{$date}/" . Str::uuid() . "." . $extension;

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
}
