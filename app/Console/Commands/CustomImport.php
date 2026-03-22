<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Package;
use App\Models\S3Config;
use App\Services\TenantBackupService;
use Illuminate\Support\Str;

class CustomImport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'custom:import';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'İnteraktif bir şekilde firma (tenant) ve yedek içe aktarım işlemi yapar.';

    /**
     * Execute the console command.
     */
    public function handle(TenantBackupService $service)
    {
        $this->info("--- Fa Medya CRM - Özel İçe Aktarım Sistemi ---");

        // 1. Dosya Yolu
        $file = $this->ask("Yedek ZIP dosyasının tam yolunu girin (Örn: C:\\yedek.zip)");
        if (!file_exists($file)) {
            $this->error("Hata: Dosya bulunamadı! -> {$file}");
            return Command::FAILURE;
        }

        // 2. Tenant İsmi
        $tenantName = $this->ask("Yeni firma (Tenant) ismini girin");
        if (!$tenantName) {
            $this->error("Hata: Firma ismi boş bırakılamaz.");
            return Command::FAILURE;
        }

        // 3. Kullanıcı Bilgileri
        $adminName = $this->ask("Yönetici (Admin) Adı Soyadı");
        $adminEmail = $this->ask("Yönetici E-posta Adresi");
        $adminPassword = $this->ask("Yönetici Şifresi");

        if (!$adminEmail || !$adminPassword) {
            $this->error("Hata: E-posta ve şifre zorunludur.");
            return Command::FAILURE;
        }

        // 4. Paket Seçimi
        $packages = Package::all(['id', 'name']);
        $this->info("\nMevcut Paketler:");
        foreach ($packages as $pkg) {
            $this->line("ID: {$pkg->id} - {$pkg->name}");
        }
        $packageId = $this->ask("Seçilecek paketin ID numarasını girin");

        $package = Package::find($packageId);
        if (!$package) {
            $this->error("Hata: Geçersiz paket ID'si.");
            return Command::FAILURE;
        }

        // 5. İşlemleri Başlat
        // S3 Yapılandırması
        $s3Config = S3Config::where('is_active', true)->inRandomOrder()->first();
        if (!$s3Config) {
            $this->error("Hata: Aktif S3 yapılandırması bulunamadı.");
            return Command::FAILURE;
        }

        $this->warn("\nİşlem başlatılıyor...");

        try {
            // Firma Oluştur
            $tenant = Tenant::create([
                'id' => Str::uuid()->toString(),
                'name' => $tenantName,
                'slug' => Str::slug($tenantName) . '-' . rand(1000, 9999),
                's3_config_id' => $s3Config->id,
                'package_id' => $package->id,
            ]);

            $this->info("Firma oluşturuldu: {$tenant->id}");

            // Verileri İçe Aktar
            $this->info("Yedek verileri içe aktarılıyor...");

            $progressBar = $this->output->createProgressBar(100);
            $progressBar->start();

            $startTime = microtime(true);
            $lastUpdate = 0;
            $timeStr = "Hesaplanıyor...";

            $progressBar->setFormat(" %current%/%max% [%bar%] %percent:3s%% -- %message% (Tahmini Kalan Süre: %remaining_time%)");
            $progressBar->setMessage($timeStr, 'remaining_time');

            $service->importBackupZip($file, $tenant->id, null, null, function ($percent, $message) use ($progressBar, $startTime, &$lastUpdate, &$timeStr) {
                $progressBar->setProgress($percent);
                $now = microtime(true);

                // Tahmini her 0.5 saniyede bir veya önemli ilerlemelerde güncelle
                if ($percent > 0 && ($now - $lastUpdate > 0.5 || $percent == 100)) {
                    $elapsed = $now - $startTime;

                    // İlerleme çok küçükse tahmini henüz gösterme
                    if ($percent >= 2) {
                        $estimatedTotal = $elapsed / ($percent / 100);
                        $remaining = max(0, round($estimatedTotal - $elapsed));

                        if ($percent < 100) {
                            $minutes = floor($remaining / 60);
                            $seconds = $remaining % 60;
                            $timeStr = ($minutes > 0 ? "{$minutes}dk " : "") . "{$seconds}sn";
                        }
                        else {
                            $timeStr = "Tamamlandı";
                        }
                    }
                    else {
                        $timeStr = "Hesaplanıyor...";
                    }
                    $lastUpdate = $now;
                }

                $progressBar->setMessage($message);
                $progressBar->setMessage($timeStr, 'remaining_time');
            });

            $progressBar->finish();
            $this->line("");

            // Yönetici Kullanıcıyı Oluştur (Import işlemi userları sildiği için sonra ekliyoruz)
            $this->info("Yönetici kullanıcısı oluşturuluyor...");
            $service->createAdminForTenant($tenant->id, $adminName, $adminEmail, $adminPassword);

            $this->info("\nTEBRİKLER! İçe aktarma başarıyla tamamlandı.");
            $this->info("Giriş Bilgileri:");
            $this->line("E-posta: {$adminEmail}");
            $this->line("Şifre: (Girdiğiniz şifre)");
            $this->line("Firma: {$tenantName}");

        }
        catch (\Exception $e) {
            $this->error("\nBir hata oluştu: " . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
