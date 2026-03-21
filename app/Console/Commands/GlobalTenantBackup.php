<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GlobalTenantBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:backup-all';
    protected $description = 'Tüm tenants verilerini JSON olarak yedekler ve S3 merkezi deposuna yükler.';

    public function handle(\App\Services\TenantBackupService $service)
    {
        $tenants = \App\Models\Tenant::where('is_active', true)->get();
        $this->info($tenants->count() . " firma için yedekleme başlatılıyor...");

        foreach ($tenants as $tenant) {
            $this->info("Yedekleniyor: " . $tenant->name);
            
            try {
                $backupData = $service->generateBackupData($tenant->id);
                $jsonContent = json_encode($backupData, JSON_UNESCAPED_UNICODE);
                $filename = \Illuminate\Support\Str::slug($tenant->name, '_') . '_auto_' . now()->timestamp . ".json";
                
                // Upload to System Admin's S3 (the 's3' disk in config/filesystems.php)
                $path = "backups/global/tenants/{$tenant->id}/{$filename}";
                \Illuminate\Support\Facades\Storage::disk('s3')->put($path, $jsonContent);
                
                $this->info("  - Başarılı: " . $filename);
            } catch (\Exception $e) {
                $this->error("  - Hata (" . $tenant->name . "): " . $e->getMessage());
            }
        }

        $this->info("Tüm işlemler tamamlandı.");
    }
}
