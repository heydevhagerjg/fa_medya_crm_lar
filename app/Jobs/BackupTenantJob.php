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
            // No password for auto backups unless configured globally? Let's use null for now.
            $zipPath = $service->createBackupZip($tenantId);
            
            if (file_exists($zipPath)) {
                $filename = basename($zipPath);
                $s3Path = "tenants/{$tenantId}/backups/{$filename}";
                
                Storage::disk('s3_global')->put($s3Path, file_get_contents($zipPath));
                
                // Cleanup local temp file
                @unlink($zipPath);
                
                Log::info("S3 full auto backup (ZIP) created successfully for tenant ID {$tenantId}: {$filename}");
            }
        } catch (\Exception $e) {
            Log::error("S3 Full Auto Backup failed for tenant ID {$tenantId}: " . $e->getMessage());
        }
    }
}
