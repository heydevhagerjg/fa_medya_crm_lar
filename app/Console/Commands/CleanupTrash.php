<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\JobFile;
use App\Models\Tenant;
use Illuminate\Support\Facades\Storage;
use App\Traits\S3GlobalConfigTrait;
use Illuminate\Support\Facades\Log;

class CleanupTrash extends Command
{
    use S3GlobalConfigTrait;

    protected $signature = 'trash:cleanup';
    protected $description = 'Automatically delete files trashed for more than 30 days';

    public function handle()
    {
        $expiredFiles = JobFile::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays(30))
            ->get();

        $count = $expiredFiles->count();
        if ($count === 0) {
            $this->info('No expired files in trash.');
            return;
        }

        $this->info("Found {$count} expired files. Starting cleanup...");

        foreach ($expiredFiles as $jobFile) {
            $job = $jobFile->job;
            if (!$job) {
                // Orphaned file?
                $jobFile->forceDelete();
                continue;
            }

            $tenant = Tenant::find($job->tenant_id);
            if (!$tenant) {
                $jobFile->forceDelete();
                continue;
            }

            // Standard S3 deletion logic
            if ($this->setGlobalS3Config($tenant->id)) {
                $path = $jobFile->file_path;
    
                if (filter_var($path, FILTER_VALIDATE_URL)) {
                    $parsed = parse_url($path);
                    $path = ltrim($parsed['path'] ?? '', '/');
                    $path = urldecode($path);
                }
    
                try {
                    Storage::disk('s3_global')->delete($path);
                } catch (\Exception $e) {
                    Log::error("Cleanup: S3 Delete failed for file {$jobFile->id}: " . $e->getMessage());
                }
            }

            // Decrement quota
            $tenant->decrement('storage_used', $jobFile->file_size);
            
            // Permanent delete from DB
            $jobFile->forceDelete();
        }

        $this->info('Cleanup completed.');
    }
}
