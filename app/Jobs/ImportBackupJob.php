<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ImportBackupJob implements ShouldQueue
{
    use Queueable;

    public $zipPath;
    public $targetTenantId;
    public $password;
    public $invokerUserId;

    /**
     * Create a new job instance.
     */
    public function __construct($zipPath, $targetTenantId, $password = null, $invokerUserId = null)
    {
        $this->zipPath = $zipPath;
        $this->targetTenantId = $targetTenantId;
        $this->password = $password;
        $this->invokerUserId = $invokerUserId;
    }

    public function handle(\App\Services\TenantBackupService $service): void
    {
        $isS3 = str_starts_with($this->zipPath, 's3://');
        $localPath = $this->zipPath;
        $tempDownloadPath = null;

        try {
            if ($isS3) {
                $s3Path = str_replace('s3://', '', $this->zipPath);
                
                // Get active S3 config
                $s3Config = \App\Models\S3Config::where('is_active', true)->inRandomOrder()->first();
                if (!$s3Config) {
                    throw new \Exception("Aktif S3 bulunamadı.");
                }

                $disk = \Illuminate\Support\Facades\Storage::build([
                    'driver' => 's3',
                    'key'    => $s3Config->aws_access_key_id,
                    'secret' => $s3Config->aws_secret_access_key,
                    'region' => $s3Config->aws_region,
                    'bucket' => $s3Config->aws_bucket_name,
                    'endpoint' => $s3Config->aws_endpoint,
                    'use_path_style_endpoint' => (bool)$s3Config->use_path_style_endpoint,
                    'throw'  => true,
                ]);

                $tempDir = storage_path('app/temp_backups');
                if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);
                $tempDownloadPath = $tempDir . '/' . \Illuminate\Support\Str::random(40) . '.zip';
                
                // Download from S3 to local temp
                file_put_contents($tempDownloadPath, $disk->get($s3Path));
                $localPath = $tempDownloadPath;
            }

            // Progress callback - Cache'e progress'i yaz
            $progressKey = "import_progress_{$this->targetTenantId}";
            
            $progressCallback = function($percent, $message) use ($progressKey) {
                \Illuminate\Support\Facades\Cache::put($progressKey, [
                    'progress' => $percent,
                    'message' => $message
                ], now()->addHours(2));
            };
            
            // Start with 0%
            $progressCallback(0, 'İçe aktarma başlatılıyor...');
            
            // Import with progress callback - manageRestoringFlag = true (job handle ediyor)
            $service->importBackupZip($localPath, $this->targetTenantId, $this->password, $this->invokerUserId, $progressCallback);
            
            // Final progress
            $progressCallback(100, 'İçe aktarma tamamlandı');
        } finally {
            // Delete the local temp file
            if (file_exists($localPath)) {
                unlink($localPath);
            }
            if ($tempDownloadPath && file_exists($tempDownloadPath)) {
                unlink($tempDownloadPath);
            }
            
            // Clean up the parent directory if empty
            $parentDir = dirname($localPath);
            if (is_dir($parentDir) && basename($parentDir) === 'temp_backups') {
                $files = array_diff(scandir($parentDir), array('.', '..'));
                if (empty($files)) {
                    @rmdir($parentDir);
                }
            }
        }
    }
}
