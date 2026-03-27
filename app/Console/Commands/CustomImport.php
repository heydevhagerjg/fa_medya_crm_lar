<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Package;
use App\Models\S3Config;
use App\Services\TenantBackupService;
use App\Jobs\ImportBackupJob;
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

            // Yönetici Kullanıcıyı Oluştur (Import ÖNCE oluştur - çünkü resetTenantData() tüm userları siler)
            $this->info("Yönetici kullanıcısı oluşturuluyor...");
            $adminUser = $service->createAdminForTenant($tenant->id, $adminName, $adminEmail, $adminPassword);
            $this->info("Yönetici kullanıcısı başarıyla oluşturuldu.");

            // is_restoring flagını SET ET - middleware hemen istekleri bloke etmeye başlayacak
            $tenant->update(['is_restoring' => true]);
            $this->warn("İçe aktarma başlıyor - sistem restore modunda...");

            // Yedek dosyasını temp dizine kopyala
            $tempFile = storage_path('app/imports/temp_' . Str::random(16) . '.zip');
            @mkdir(dirname($tempFile), 0755, true);
            copy($file, $tempFile);

            // Background job olarak import başlat - Admin user'ı korumak için invokerUserId geçiyoruz
            // ImportBackupJob, is_restoring = true ile başlayıp (zaten true ama iyileme için), false ile bitirecek
            ImportBackupJob::dispatch($tempFile, $tenant->id, null, $adminUser->id);

            $this->info("\n✅ İçe aktarma işlemi başlatıldı (arka planda çalışıyor)");
            $this->info("Giriş Bilgileri:");
            $this->line("E-posta: {$adminEmail}");
            $this->line("Şifre: (Girdiğiniz şifre)");
            $this->line("Firma: {$tenantName}");
            $this->warn("\n📌 Bilgiler:");
            $this->line("• Sistem restore modundadır");
            $this->line("• İçe aktarma arka planda çalışıyor");
            $this->line("• Tamamlanana kadar \"Yedekten geri dönülüyor... Lütfen bekleyin.\" mesajı göreceksiniz");
            $this->line("• Queue worker'ın çalışıyor olduğundan emin olun: php artisan queue:listen");


        }
        catch (\Exception $e) {
            $this->error("\nBir hata oluştu: " . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
