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
            $service->importBackupZip($this->zipPath, $this->targetTenantId, $this->password, $this->invokerUserId);
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
