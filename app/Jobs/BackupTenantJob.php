<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Tenant;
use App\Models\Service;
use App\Models\JobStatus;
use App\Models\StepTemplate;
use App\Models\Customer;
use App\Models\JobCrm;
use App\Models\Expense;
use App\Models\ApiKey;
use App\Models\ActivityLog;
use App\Models\ExpenseCategory;
use App\Models\CashRegister;
use App\Models\Admin;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class BackupTenantJob implements ShouldQueue
{
    use Queueable, \App\Traits\S3GlobalConfigTrait;

    private string $tenantId;

    public function __construct(string $tenantId)
    {
        $this->tenantId = $tenantId;
    }

    public function handle(): void
    {
        // OPTIMIZED: 2GB memory limit for large file streaming (10-20 GB data handling)
        @ini_set('memory_limit', '2048M');
        @set_time_limit(0);

        $tenantId = $this->tenantId;
        $tenant = Tenant::find($tenantId);
        
        if (!$tenant) {
            return;
        }

        if (!$this->setGlobalS3Config($tenantId)) {
            Log::error("S3 Full Auto Backup failed for tenant ID {$tenantId}: S3 Configuration missing.");
            return;
        }

        $service = app(\App\Services\TenantBackupService::class);
        
        try {
            // Create full ZIP backup (Data + Files)
            // Exclude users to prevent email conflicts when importing to new tenants
            $zipPath = $service->createBackupZip($tenantId, null, false);
            
            if (file_exists($zipPath)) {
                $filename = basename($zipPath);
                $s3Path = "tenants/{$tenantId}/backups/{$filename}";
                
                // file_get_contents yerine stream kullan — büyük dosyalar RAM'e sığmaz
                $stream = fopen($zipPath, 'rb');
                if (!is_resource($stream)) {
                    throw new \Exception("Yedek dosyası okunamadı: {$zipPath}");
                }
                try {
                    Storage::disk('s3_global')->writeStream($s3Path, $stream);
                } finally {
                    if (is_resource($stream)) fclose($stream);
                }
                
                // Cleanup local temp file
                @unlink($zipPath);
                
                Log::info("S3 full auto backup (ZIP) created successfully for tenant ID {$tenantId}: {$filename}");
            }
        } catch (\Exception $e) {
            Log::error("S3 Full Auto Backup failed for tenant ID {$tenantId}: " . $e->getMessage());
        }
    }
}
