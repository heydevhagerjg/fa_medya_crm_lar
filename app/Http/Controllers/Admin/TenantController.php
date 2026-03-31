<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\S3Config;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use App\Models\TenantBackup;
use App\Jobs\CreateTenantBackupJob;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\URL;

class TenantController extends Controller
{
    public function getSettings(Request $request)
    {
        $admin = $request->user();
        return response()->json([
            'aws_access_key_id'     => $admin->aws_access_key_id,
            'aws_secret_access_key' => $admin->aws_secret_access_key,
            'aws_region'            => $admin->aws_region,
            'aws_bucket_name'       => $admin->aws_bucket_name,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $admin = $request->user();
        $validated = $request->validate([
            'aws_access_key_id'     => 'nullable|string|max:255',
            'aws_secret_access_key' => 'nullable|string|max:255',
            'aws_region'            => 'nullable|string|max:255',
            'aws_bucket_name'       => 'nullable|string|max:255',
        ]);

        $admin->update($validated);
        return response()->json(['message' => 'S3 Ayarları güncellendi.']);
    }

    public function testS3Connection(Request $request)
    {
        $validated = $request->validate([
            'aws_access_key_id'     => 'required|string',
            'aws_secret_access_key' => 'required|string',
            'aws_region'            => 'required|string',
            'aws_bucket_name'       => 'required|string',
        ]);

        try {
            // Trim inputs and lowercase region to be safe
            $key = trim($validated['aws_access_key_id']);
            $secret = trim($validated['aws_secret_access_key']);
            $region = strtolower(trim($validated['aws_region']));
            $bucket = trim($validated['aws_bucket_name']);

            // Build temporary disk directly
            $disk = Storage::build([
                'driver' => 's3',
                'key'    => $key,
                'secret' => $secret,
                'region' => $region,
                'bucket' => $bucket,
                'endpoint' => $request->input('aws_endpoint') ? trim($request->input('aws_endpoint')) : null,
                'use_path_style_endpoint' => (bool)($request->input('use_path_style_endpoint') ?? false),
                'throw'  => true,
                'version' => 'latest'
            ]);
            
            // 1. Test List Permission
            $disk->files();

            // 2. Test Write/Delete Permission
            $testPath = 'admin_connection_test_' . Str::random(8) . '.txt';
            $disk->put($testPath, 'CRM Admin S3 Test');
            $disk->delete($testPath);

            return response()->json(['success' => true, 'message' => 'Bağlantı başarılı!']);
        } catch (\Exception $e) {
            $message = $e->getMessage();
            
            if (str_contains($message, 'SignatureDoesNotMatch')) {
                $message = "İmza hatası (SignatureDoesNotMatch). Lütfen Secret Access Key ve Bölge (Region) bilgilerini kontrol edin. Key kopyalanırken başta veya sonda boşluk kalmış olabilir.";
            } elseif (str_contains($message, '403 Forbidden')) {
                $message = "Erişim reddedildi (403). IAM yetkilerini kontrol edin (ListObjects, PutObject, DeleteObject).";
            } elseif (str_contains($message, 'Could not resolve host')) {
                $message = "Bucket veya Bölge hatalı (Host çözülemedi).";
            }

            return response()->json([
                'success' => false, 
                'message' => 'Hata: ' . $message
            ], 400);
        }
    }
    public function index()
    {
        $tenants = Tenant::with(['package', 's3Config'])->withCount('users')->get();
        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'package_id'     => 'required|exists:packages,id',
            's3_config_id'   => 'nullable|exists:s3_configs,id',
            'admin_name'     => 'required|string|max:255',
            'admin_email'    => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        $s3ConfigId = $validated['s3_config_id'] ?? null;

        if (!$s3ConfigId) {
            $s3Config = S3Config::where('is_active', true)->inRandomOrder()->first();
            if (!$s3Config) {
                return response()->json(['message' => 'Sistemde aktif S3 bağlantısı bulunamadı.'], 400);
            }
            $s3ConfigId = $s3Config->id;
        }

        $package = \App\Models\Package::findOrFail($validated['package_id']);

        // 1. Create Tenant
        $tenantId = Str::uuid()->toString();
        $tenant = Tenant::create([
            'id' => $tenantId,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . rand(1000, 9999),
            's3_config_id' => $s3ConfigId,
            'package_id' => $package->id,
            'plan_personnel_limit' => $package->personnel_limit,
            'plan_customer_limit' => $package->customer_limit,
            'plan_job_limit' => $package->job_limit,
            'plan_appointment_feature' => $package->appointment_feature,
            'plan_appointment_limit' => $package->appointment_limit,
            'plan_service_tracking_feature' => $package->service_tracking_feature,
            'plan_service_tracking_limit' => $package->service_tracking_limit,
            'plan_service_tracking_category_feature' => $package->service_tracking_category_feature,
            'plan_service_tracking_category_limit' => $package->service_tracking_category_limit,
            'plan_proposal_feature' => $package->proposal_feature,
            'plan_proposal_limit' => $package->proposal_limit,
            'plan_backup_feature' => $package->backup_feature,
            'plan_backup_limit' => $package->backup_limit,
            'plan_services_section_feature' => $package->services_section_feature,
            'plan_service_limit' => $package->service_limit,
            'plan_step_templates_feature' => $package->step_templates_feature,
            'plan_step_template_limit' => $package->step_template_limit,
            'plan_cash_register_limit' => $package->cash_register_limit,
            'plan_api_key_feature' => $package->api_key_feature,
            'plan_disk_usage_limit' => $package->disk_usage_limit,
            'plan_single_file_limit' => $package->single_file_limit,
            'plan_chat_feature' => $package->chat_feature,
            'plan_chat_limit' => $package->chat_limit,
            'plan_group_chat_limit' => $package->group_chat_limit,
            'plan_call_minutes_limit' => $package->call_minutes_limit,
        ]);

        // 2. Create Initial Admin User
        $user = new \App\Models\User([
            'id'          => Str::uuid()->toString(),
            'name'        => $validated['admin_name'],
            'email'       => $validated['admin_email'],
            'password'    => Hash::make($validated['admin_password']),
            'role'        => 'ADMIN',
            'is_approved' => true,
        ]);
        $user->tenant_id = $tenantId;
        $user->save();

        // 3. Create as Paddle customer with trial (Only if it's a paid package)
        if (!$package->isFree()) {
            $tenant->createAsCustomer([
                'email' => $validated['admin_email'],
                'trial_ends_at' => now()->addDays($package->trial_days),
            ]);
        }

        return response()->json([
            'tenant' => $tenant->load('package'),
            'admin'  => $user
        ], 201);
    }

    public function show($id)
    {
        $tenant = Tenant::with(['package', 'users' => function($q) {
            $q->select('id', 'name', 'email', 'role', 'is_approved', 'tenant_id', 'created_at');
        }])->findOrFail($id);
        return response()->json($tenant);
    }

    public function updateLimits(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        $validated = $request->validate([
            'package_id' => 'nullable|exists:packages,id',
            'plan_personnel_limit' => 'required|integer|min:0',
            'plan_customer_limit' => 'required|integer|min:0',
            'plan_job_limit' => 'required|integer|min:0',
            'plan_appointment_feature' => 'required|boolean',
            'plan_appointment_limit' => 'required|integer|min:0',
            'plan_service_tracking_feature' => 'required|boolean',
            'plan_service_tracking_limit' => 'required|integer|min:0',
            'plan_service_tracking_category_feature' => 'required|boolean',
            'plan_service_tracking_category_limit' => 'required|integer|min:0',
            'plan_proposal_feature' => 'required|boolean',
            'plan_proposal_limit' => 'required|integer|min:0',
            'plan_backup_feature' => 'required|boolean',
            'plan_backup_limit' => 'required|integer|min:0',
            'plan_services_section_feature' => 'required|boolean',
            'plan_service_limit' => 'required|integer|min:0',
            'plan_step_templates_feature' => 'required|boolean',
            'plan_step_template_limit' => 'required|integer|min:0',
            'plan_cash_register_limit' => 'required|integer|min:0',
            'plan_api_key_feature' => 'required|boolean',
            'plan_disk_usage_limit' => 'required|integer|min:0',
            'plan_single_file_limit' => 'required|integer|min:0',
            'plan_chat_feature' => 'required|boolean',
            'plan_chat_limit' => 'required|integer|min:0',
            'plan_group_chat_limit' => 'required|integer|min:0',
            'plan_call_minutes_limit' => 'required|integer|min:0',
        ]);

        $tenant->update($validated);
        return response()->json(['message' => 'Tenant limitleri güncellendi.', 'tenant' => $tenant]);
    }

    public function changePackage(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
        ]);

        $package = \App\Models\Package::findOrFail($validated['package_id']);
        $tenant->applyPackage($package);

        // Reset "Gifted/Unlimited" status
        $tenant->update([
            'is_gifted' => false,
        ]);

        return response()->json(['message' => 'Tenant paketi güncellendi, hediye durumu sıfırlandı ve standart ödeme kontrolüne dönüldü.', 'tenant' => $tenant->load('package')]);
    }

    public function addUser(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:ADMIN,USER',
        ]);

        $user = new \App\Models\User([
            'id' => Str::uuid()->toString(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_approved' => true,
        ]);
        $user->tenant_id = $tenant->id;
        $user->save();

        return response()->json($user, 201);
    }

    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();

        return response()->json(['message' => 'Firma (Tenant) başarıyla silindi.']);
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:tenants,id'
        ]);

        $tenants = Tenant::whereIn('id', $validated['ids'])->get();
        $count = 0;
        
        foreach ($tenants as $tenant) {
            $tenant->delete();
            $count++;
        }

        return response()->json([
            'message' => "$count firma ve firmaya ait tüm veriler başarıyla silindi."
        ]);
    }
    public function updateStatus(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        $validated = $request->validate([
            'is_active' => 'required|boolean',
            'suspension_message' => 'nullable|string',
        ]);

        $tenant->update($validated);

        return response()->json(['message' => 'Tenant durumu güncellendi.', 'tenant' => $tenant]);
    }

    public function giftPackage(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
        ]);

        $package = \App\Models\Package::findOrFail($validated['package_id']);
        
        // 1. Apply features and limits
        $tenant->applyPackage($package);
        
        // 2. Set as GIFTED
        $tenant->update([
            'is_gifted' => true,
        ]);

        return response()->json([
            'message' => 'Paket sınırsız (100 yıl) süreyle tenant\'a başarıyla tanımlandı.',
            'tenant' => $tenant->load('package')
        ]);
    }

    public function updateS3Config(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        $validated = $request->validate([
            's3_config_id' => 'nullable|exists:s3_configs,id'
        ]);

        $tenant->update([
            's3_config_id' => $validated['s3_config_id']
        ]);

        return response()->json([
            'message' => $validated['s3_config_id'] ? 'S3 Yapılandırması güncellendi.' : 'S3 Yetkisi kaldırıldı.',
            'tenant' => $tenant->load('s3Config')
        ]);
    }

    public function backup($id, \App\Services\TenantBackupService $service, Request $request)
    {
        $tenant = Tenant::findOrFail($id);
        $password = $request->query('password');
        $zipPath = $service->createBackupZip($id, $password);
        
        $fileName = \Illuminate\Support\Str::slug($tenant->name, '_') . '_full_backup.zip';
        
        return response()->download($zipPath, $fileName)->deleteFileAfterSend();
    }

    public function createBackup($id)
    {
        $tenant = Tenant::findOrFail($id);

        // Talebi hemen sıfırlama, yedek bittiğinde sıfırla (CreateTenantBackupJob içinde)
        // $tenant->update(['backup_requested' => false]);

        $backup = TenantBackup::create([
            'tenant_id' => $tenant->id,
            'filename' => Str::slug($tenant->name, '_') . '_backup.zip',
            'path' => '',
            'status' => 'pending',
        ]);

        CreateTenantBackupJob::dispatch($backup);

        return response()->json([
            'message' => 'Yedekleme işlemi arka planda başlatıldı.',
            'backup' => $backup
        ]);
    }

    public function rejectBackupRequest($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['backup_requested' => false]);

        return response()->json(['message' => 'Yedekleme talebi reddedildi.']);
    }

    public function backups($id)
    {
        $backups = TenantBackup::where('tenant_id', $id)
            ->latest()
            ->get()
            ->map(function($backup) {
                if ($backup->status === 'processing') {
                    $cached = Cache::get("backup_status_{$backup->id}");
                    if ($cached) {
                        $backup->progress = $cached['progress'] ?? $backup->progress;
                        $backup->real_time_message = $cached['message'] ?? null;
                    }
                }
                
                // Dosyanın gerçekten var olup olmadığını kontrol et
                $backup->has_file = $backup->status === 'completed' && $backup->path && File::exists(storage_path('app/' . $backup->path));
                
                return $backup;
            });

        return response()->json($backups);
    }

    public function allBackups()
    {
        $backups = TenantBackup::with('tenant:id,name')
            ->latest()
            ->get()
            ->map(function($backup) {
                if ($backup->status === 'processing') {
                    $cached = Cache::get("backup_status_{$backup->id}");
                    if ($cached) {
                        $backup->progress = $cached['progress'] ?? $backup->progress;
                        $backup->real_time_message = $cached['message'] ?? null;
                    }
                }
                
                $backup->has_file = $backup->status === 'completed' && $backup->path && File::exists(storage_path('app/' . $backup->path));
                
                return $backup;
            });

        return response()->json($backups);
    }

    public function deleteBackup($id)
    {
        $backup = TenantBackup::findOrFail($id);
        
        if ($backup->status === 'processing' || $backup->status === 'pending') {
            return response()->json(['message' => 'İşlem devam ettiği için silinemez. Önce iptal edin.'], 400);
        }

        // Fiziksel dosyayı sil
        if ($backup->path) {
            $filePath = storage_path('app/' . $backup->path);
            if (File::exists($filePath)) {
                File::delete($filePath);
                
                // Klasörü temizle
                $directory = dirname($filePath);
                if (File::isDirectory($directory) && count(File::files($directory)) === 0 && count(File::directories($directory)) === 0) {
                    File::deleteDirectory($directory);
                }

                // Eger backups/tenants/ klasörü de boşsa orayı da temizleyebiliriz
                $parentDir = dirname($directory);
                if (basename($parentDir) === 'tenants' && File::isDirectory($parentDir) && count(File::files($parentDir)) === 0 && count(File::directories($parentDir)) === 0) {
                    File::deleteDirectory($parentDir);
                }
            }
        }

        $backup->delete();

        return response()->json(['message' => 'Yedek ve ilgili kayıt başarıyla silindi.']);
    }

    public function getDownloadSignedUrl($id)
    {
        // Admin can download any backup
        TenantBackup::findOrFail($id);

        $url = URL::temporarySignedRoute(
            'backup.download.public',
            now()->addMinutes(15),
            ['id' => $id]
        );

        return response()->json(['url' => $url]);
    }

    public function cancelBackup($id)
    {
        $backup = TenantBackup::findOrFail($id);
        
        if ($backup->status === 'processing' || $backup->status === 'pending') {
            // Signal cancellation to running job
            Cache::put("backup_cancelled_{$id}", true, now()->addMinutes(10));
            
            // Update status
            $backup->update([
                'status' => 'failed',
                'error' => 'Kullanıcı tarafından iptal edildi.'
            ]);
            
            // IMPORTANT: Clean up any orphaned temp files
            try {
                $baseTemp = storage_path('app/backup-temp');
                if (File::isDirectory($baseTemp)) {
                    // List all directories - they are temporary backup working dirs
                    $dirs = File::directories($baseTemp);
                    foreach ($dirs as $dir) {
                        // Safe cleanup: only delete if directory exists and is empty or contains temp files
                        if (File::isDirectory($dir)) {
                            File::deleteDirectory($dir);
                        }
                    }
                    
                    // Remove base temp if now empty
                    if (File::isDirectory($baseTemp) && count(File::files($baseTemp)) === 0 && count(File::directories($baseTemp)) === 0) {
                        File::deleteDirectory($baseTemp);
                    }
                }
            } catch (\Exception $e) {
                // Log but don't fail the cancellation
                \Illuminate\Support\Facades\Log::warning("Backup cancel cleanup warning: " . $e->getMessage());
            }

            return response()->json(['message' => 'Yedekleme iptal edildi.']);
        }

        return response()->json(['message' => 'İşlem iptal edilemez durumdadır.'], 400);
    }

    public function downloadBackup($backupId)
    {
        $backup = TenantBackup::findOrFail($backupId);

        if ($backup->status !== 'completed') {
            return response()->json(['message' => 'Yedek henüz tamamlanmadı.'], 400);
        }

        $filePath = storage_path('app/' . $backup->path);

        if (!File::exists($filePath)) {
            return response()->json(['message' => 'Dosya sistemde bulunamadı.'], 404);
        }

        return response()->download($filePath, $backup->filename);
    }

    public function importSignedUrl(Request $request)
    {
        $validated = $request->validate([
            'filename' => 'required|string',
            'file_type' => 'required|string',
        ]);

        $s3Config = S3Config::where('is_active', true)->inRandomOrder()->first();
        if (!$s3Config) {
            return response()->json(['message' => 'Aktif S3 bulunamadı.'], 400);
        }

        $extension = pathinfo($validated['filename'], PATHINFO_EXTENSION);
        if ($extension !== 'zip') {
            return response()->json(['message' => 'Sadece ZIP dosyaları kabul edilir.'], 400);
        }

        $s3Key = 'imports/temp/' . Str::uuid() . '.zip';
        
        $disk = Storage::build([
            'driver' => 's3',
            'key'    => $s3Config->aws_access_key_id,
            'secret' => $s3Config->aws_secret_access_key,
            'region' => $s3Config->aws_region,
            'bucket' => $s3Config->aws_bucket_name,
            'endpoint' => $s3Config->aws_endpoint,
            'use_path_style_endpoint' => (bool)$s3Config->use_path_style_endpoint,
            'throw'  => true,
            'version' => 'latest'
        ]);

        $client = $disk->getClient();
        $command = $client->getCommand('PutObject', [
            'Bucket' => $s3Config->aws_bucket_name,
            'Key'    => $s3Key,
        ]);

        $signedUrl = (string)$client->createPresignedRequest($command, '+60 minutes')->getUri();

        return response()->json([
            'upload_url' => $signedUrl,
            's3_path'    => $s3Key,
            's3_config_id' => $s3Config->id
        ]);
    }

    public function import(Request $request, \App\Services\TenantBackupService $service)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'package_id' => 'required|exists:packages,id',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
            'file' => 'nullable|file|mimes:zip',
            's3_path' => 'nullable|string',
        ]);

        $s3ConfigId = $request->input('s3_config_id');
        $s3Config = null;
        
        if ($s3ConfigId) {
            $s3Config = S3Config::find($s3ConfigId);
        }

        if (!$s3Config) {
            $s3Config = S3Config::where('is_active', true)->inRandomOrder()->first();
        }

        if (!$s3Config) {
            return response()->json(['message' => 'Aktif S3 bulunamadı.'], 400);
        }

        $package = \App\Models\Package::findOrFail($request->package_id);

        $tenant = null;
        $adminUser = null;

        try {
            // 1. Create a "shell" tenant
            $tenantId = Str::uuid()->toString();
            $tenant = Tenant::create([
                'id' => $tenantId,
                'name' => $request->name,
                'slug' => Str::slug($request->name) . '-' . rand(1000, 9999),
                's3_config_id' => $s3Config->id,
                'package_id' => $package->id,
            ]);

            $tenant->applyPackage($package);

            // 2. Create Initial Admin User
            $adminUser = $service->createAdminForTenant($tenantId, $request->admin_name, $request->admin_email, $request->admin_password);

            $zipPath = null;
            
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $tempDir = storage_path('app/temp_backups');
                if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);
                $fileName = Str::random(40) . '.zip';
                $zipPath = $tempDir . '/' . $fileName;
                $file->move($tempDir, $fileName);
            } elseif ($request->s3_path) {
                $zipPath = 's3://' . $request->s3_path;
            } else {
                throw new \Exception("Yedek dosyası seçilmedi.");
            }

            $tenant->update(['is_restoring' => true]);

            \App\Jobs\ImportBackupJob::dispatch($zipPath, $tenant->id, $request->input('password'), $adminUser->id);

            return response()->json([
                'status' => 'success',
                'message' => 'Firma oluşturma ve yedek aktarma işlemi arka planda başlatıldı.',
                'tenant' => $tenant
            ]);
        } catch (\Exception $e) {
            if ($adminUser) $adminUser->delete();
            if ($tenant) $tenant->delete(); 
            \Illuminate\Support\Facades\Log::error("Admin Import Error: " . $e->getMessage());
            return response()->json(['message' => 'Hata: ' . $e->getMessage()], 500);
        }
    }
    public function getImportProgress($id)
    {
        $tenant = Tenant::findOrFail($id);
        
        if (!$tenant->is_restoring) {
            return response()->json(['progress' => 100, 'message' => 'Aktif bir yükleme işlemi yok.', 'is_finished' => true]);
        }

        $progressData = \Illuminate\Support\Facades\Cache::get("import_progress_{$id}");
        
        return response()->json($progressData ?: [
            'progress' => 0, 
            'message' => 'İşlem hazırlanıyor...',
            'is_finished' => false
        ]);
    }

    public function cancelImport($id, \App\Services\TenantBackupService $service)
    {
        $tenant = Tenant::find($id);
        
        if (!$tenant || !$tenant->is_restoring) {
            return response()->json(['message' => 'İptal edilecek aktif bir yükleme yok.'], 400);
        }

        // Set cancel flag for the background job
        \Illuminate\Support\Facades\Cache::put("import_cancel_{$id}", true, now()->addMinutes(15));
        
        // Update progress info to show it's cancelling
        \Illuminate\Support\Facades\Cache::put("import_progress_{$id}", [
            'progress' => 0,
            'message' => 'İptal ediliyor ve firma siliniyor...',
            'status' => 'cancelling'
        ], now()->addMinutes(15));

        // AGGRESSIVE CLEANUP: If the job hasn't started or is at 0%, we can try to wipe it right here
        // to prevent UI stuck when queue worker is not running or busy.
        try {
            $progressData = \Illuminate\Support\Facades\Cache::get("import_progress_{$id}");
            // If it's still at 0 or specifically our 'cancelling' message, try cleanup
            if (!$progressData || $progressData['progress'] <= 5) {
                $service->resetTenantData($id, null, true);
                $tenant->delete();
                return response()->json(['message' => 'İşlem iptal edildi ve firma tamamen silindi.']);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Immediate cancel cleanup failed for tenant {$id}: " . $e->getMessage());
        }

        return response()->json(['message' => 'İptal talebi alındı. Firma kısa süre içinde tamamen silinecek.']);
    }
}
