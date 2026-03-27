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
        @set_time_limit(0);
        @ini_set('memory_limit', '1024M');

        $isS3 = str_starts_with($this->zipPath, 's3://');
        $localPath = $this->zipPath;
        $tempDownloadPath = null;
        $s3Disk = null;
        $s3RelativePath = null;

        try {
            if ($isS3) {
                $s3RelativePath = str_replace('s3://', '', $this->zipPath);
                
                // Get active S3 config
                $s3Config = \App\Models\S3Config::where('is_active', true)->inRandomOrder()->first();
                if (!$s3Config) {
                    throw new \Exception("Aktif S3 bulunamadı.");
                }

                $s3Disk = \Illuminate\Support\Facades\Storage::build([
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
                
                // Download from S3 to local temp with a more interactive approach if possible
                // For now, let's at least check cancellation before starting download
                if (\Illuminate\Support\Facades\Cache::has("import_cancel_{$this->targetTenantId}")) {
                    throw new \Exception("İşlem kullanıcı tarafından iptal edildi.", 499);
                }

                // Check again if progress key is ready
                $progressKey = "import_progress_{$this->targetTenantId}";
                \Illuminate\Support\Facades\Cache::put($progressKey, [
                    'progress' => 5,
                    'message' => 'Yedek dosyası S3\'ten indiriliyor...'
                ], now()->addHours(2));

                file_put_contents($tempDownloadPath, $s3Disk->get($s3RelativePath));
                $localPath = $tempDownloadPath;

                if (\Illuminate\Support\Facades\Cache::has("import_cancel_{$this->targetTenantId}")) {
                    throw new \Exception("İşlem kullanıcı tarafından iptal edildi.", 499);
                }
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

            // Cleanup S3 file if it was a temp uploaded one
            if ($isS3 && $s3Disk && $s3RelativePath) {
                $s3Disk->delete($s3RelativePath);
            }

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("ImportBackupJob Error for Tenant {$this->targetTenantId}: " . $e->getMessage());
            $tenant = \App\Models\Tenant::find($this->targetTenantId);
            if ($tenant) {
                // Wipe data and delete tenant if it was being restored
                $service->resetTenantData($tenant->id, null, true);
                $tenant->delete();
            }

            // Also cleanup S3 file if it was a temp uploaded one
            if ($isS3 && $s3Disk && $s3RelativePath) {
                @$s3Disk->delete($s3RelativePath);
            }
            
            // Final progress update
            $progressKey = "import_progress_{$this->targetTenantId}";
            \Illuminate\Support\Facades\Cache::put($progressKey, [
                'progress' => 0,
                'message' => 'Hata: ' . $e->getMessage(),
                'status' => 'error'
            ], now()->addHours(2));

            // Log original exception
            throw $e;
        } finally {
            // Delete the local temp file
            if (isset($localPath) && !str_starts_with($localPath, 's3://') && file_exists($localPath)) {
                @unlink($localPath);
            }
            if (isset($tempDownloadPath) && !str_starts_with($tempDownloadPath, 's3://') && file_exists($tempDownloadPath)) {
                @unlink($tempDownloadPath);
            }
            
            // Clean up the parent directory if empty
            if (isset($localPath) && !str_starts_with($localPath, 's3://')) {
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
}
