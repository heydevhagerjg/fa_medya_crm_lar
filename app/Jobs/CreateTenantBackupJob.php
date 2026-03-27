<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use App\Models\TenantBackup;
use App\Services\TenantBackupService;

class CreateTenantBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $backup;

    /**
     * Create a new job instance.
     */
    public function __construct(TenantBackup $backup)
    {
        $this->backup = $backup;
    }

    /**
     * Execute the job.
     */
    public function handle(TenantBackupService $service): void
    {
        // OPTIMIZED: 2GB memory limit for large file streaming (10-20 GB data handling)
        @ini_set('memory_limit', '2048M');
        @set_time_limit(0);

        $this->backup->update(['status' => 'processing', 'progress' => 0]);

        $zipPath = null;
        try {
            $zipPath = $service->createBackupZip($this->backup->tenant_id, null, true, function($p, $msg) {
                // Use Cache instead of DB for frequent updates
                \Illuminate\Support\Facades\Cache::put("backup_status_{$this->backup->id}", [
                    'progress' => $p,
                    'message' => $msg
                ], now()->addMinutes(10));
            }, $this->backup->id);

            if (File::exists($zipPath)) {
                $finalDir = storage_path('app/backups/tenants/' . $this->backup->tenant_id);
                if (!File::exists($finalDir)) {
                    File::makeDirectory($finalDir, 0755, true);
                }

                $fileName = basename($zipPath);
                $destination = $finalDir . '/' . $fileName;
                
                File::move($zipPath, $destination);

                $this->backup->update([
                    'status' => 'completed',
                    'path' => 'backups/tenants/' . $this->backup->tenant_id . '/' . $fileName,
                    'filename' => $fileName,
                    'size' => File::size($destination),
                ]);

                // Yedekleme talebi başarıyla karşılandı
                if ($this->backup->tenant) {
                    $this->backup->tenant->update(['backup_requested' => false]);
                }
            } else {
                throw new \Exception("Yedek dosyası oluşturulamadı.");
            }
        } catch (\Exception $e) {
            $this->backup->update([
                'status' => 'failed',
                'error' => $e->getMessage()
            ]);
        } finally {
            // Arta kalan geçici dosyayı temizle (egeer move basarısız olduysa veya baska hata çıktıysa)
            if ($zipPath && File::exists($zipPath)) {
                File::delete($zipPath);
            }
        }
    }
}
