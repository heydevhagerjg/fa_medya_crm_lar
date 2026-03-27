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
        try {
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
            $service->importBackupZip($this->zipPath, $this->targetTenantId, $this->password, $this->invokerUserId, $progressCallback);
            
            // Final progress
            $progressCallback(100, 'İçe aktarma tamamlandı');
        } finally {
            // Delete the temp file
            if (file_exists($this->zipPath)) {
                unlink($this->zipPath);
            }
            
            // Clean up the parent directory if empty
            $parentDir = dirname($this->zipPath);
            if (is_dir($parentDir)) {
                $files = array_diff(scandir($parentDir), array('.', '..'));
                if (empty($files)) {
                    @rmdir($parentDir);
                }
            }
        }
    }
}
