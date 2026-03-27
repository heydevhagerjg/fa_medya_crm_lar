<?php

namespace App\Modules\Chat\Jobs;

use App\Modules\Chat\Models\MessageAttachment;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Intervention\Image\Laravel\Facades\Image;
use Illuminate\Support\Facades\Log;

class GenerateFilePreviewJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public MessageAttachment $attachment
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->attachment->file_type !== 'image') {
            return;
        }

        try {
            // 1. Get tenant specific S3 disk
            $tenantId = $this->attachment->message->chat->tenant_id;
            $disk = Tenant::getS3DiskForTenant($tenantId);

            if (!$disk) {
                Log::error("S3 Cleanup - Disk not found for tenant: {$tenantId}");
                return;
            }

            // 2. Read image from S3
            $content = $disk->get($this->attachment->s3_path);
            
            // 3. Generate thumbnail (300x300)
            $thumbnail = Image::read($content)
                ->scale(300, 300)
                ->encodeByExtension('jpg', 80);

            // 4. Save thumbnail to S3
            $thumbPath = str_replace('attachments/', 'attachments/previews/', $this->attachment->s3_path);
            $disk->put($thumbPath, $thumbnail, ['visibility' => 'private']);

            // 5. Update record
            $this->attachment->update([
                'preview_url' => $disk->url($thumbPath),
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to generate preview for attachment {$this->attachment->id}: " . $e->getMessage());
        }
    }
}
