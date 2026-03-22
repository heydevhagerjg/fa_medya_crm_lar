<?php

namespace App\Console\Commands;

use App\Models\TenantBackup;
use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Services\TenantBackupService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class CustomExport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'custom:export';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Belirli bir firmanın (tenant) tüm verilerini (kullanıcılar hariç) dışa aktarır.';

    /**
     * Execute the console command.
     */
    public function handle(TenantBackupService $service)
    {
        $this->info("--- Fa Medya CRM - Özel Dışa Aktarım Sistemi ---");

        // 1. Firma Listesi ve Seçimi
        $tenants = Tenant::all(['id', 'name', 'slug']);
        if ($tenants->isEmpty()) {
            $this->error("Hata: Kayıtlı firma bulunamadı.");
            return Command::FAILURE;
        }

        $this->info("\nMevcut Firmalar:");
        foreach ($tenants as $t) {
            $this->line("ID: {$t->id} - İsim: {$t->name} ({$t->slug})");
        }

        $tenantId = $this->ask("Dışa aktarılacak firmanın ID numarasını girin");
        $tenant = Tenant::find($tenantId);

        if (!$tenant) {
            $this->error("Hata: Geçersiz firma ID'si.");
            return Command::FAILURE;
        }

        $this->warn("\n{$tenant->name} verileri hazırlanıyor...");
        $this->info("Not: Kullanıcı bilgileri (User) güvenlik nedeniyle dahil edilmeyecektir.");

        try {
            // 2. Export İşlemini Başlat
            $this->info("Yedek dosyası oluşturuluyor (Dosyalar S3'ten çekiliyor, bu işlem zaman alabilir)...");
            
            // createBackupZip(tenantId, password=null, includeUsers=false)
            $zipPath = $service->createBackupZip($tenant->id, null, false);

            if (file_exists($zipPath)) {
                $finalDir = storage_path('app/backups/tenants/' . $tenant->id);
                if (!file_exists($finalDir)) {
                    File::makeDirectory($finalDir, 0755, true);
                }

                $fileName = basename($zipPath);
                $destination = $finalDir . '/' . $fileName;
                
                File::move($zipPath, $destination);

                // Veritabanı kaydı oluştur
                TenantBackup::create([
                    'tenant_id' => $tenant->id,
                    'filename' => $fileName,
                    'path' => 'backups/tenants/' . $tenant->id . '/' . $fileName,
                    'size' => File::size($destination),
                    'status' => 'completed',
                ]);

                $this->info("\nTEBRİKLER! Dışa aktarma başarıyla tamamlandı.");
                $this->info("Dosya Konumu: {$destination}");
                $this->line("Bu dosya admin panelinde de 'Yedekler' kısmında görünecektir.");
            } else {
                $this->error("Hata: Yedek dosyası oluşturulamadı.");
                return Command::FAILURE;
            }

        } catch (\Exception $e) {
            $this->error("\nBir hata oluştu: " . $e->getMessage());
            $this->line($e->getTraceAsString());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
