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

    public function import(Request $request, \App\Services\TenantBackupService $service)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'package_id' => 'required|exists:packages,id',
            'file' => 'required|file|mimes:zip',
        ]);

        // 1. Create a "shell" tenant with chosen name and package
        $s3Config = S3Config::where('is_active', true)->inRandomOrder()->first();
        if (!$s3Config) {
            return response()->json(['message' => 'Aktif S3 bulunamadı.'], 400);
        }

        $package = \App\Models\Package::findOrFail($request->package_id);

        $tenant = Tenant::create([
            'id' => Str::uuid()->toString(),
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . rand(1000, 9999),
            's3_config_id' => $s3Config->id,
            'package_id' => $package->id,
        ]);

        $tenant->applyPackage($package);

        try {
            $file = $request->file('file');
            $tempDir = storage_path('app/temp_backups');
            if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);
            
            $fileName = \Illuminate\Support\Str::random(40) . '.zip';
            $zipPath = $tempDir . '/' . $fileName;
            
            // Move uploaded file to temp storage for the Job
            $file->move($tempDir, $fileName);

            $tenant->update(['is_restoring' => true]);

            // Dispatch background job
            \App\Jobs\ImportBackupJob::dispatch($zipPath, $tenant->id, $request->input('password'));

            return response()->json([
                'status' => 'success',
                'message' => 'Firma oluşturma ve yedek aktarma işlemi arka planda başlatıldı.',
                'tenant' => $tenant
            ]);
        } catch (\Exception $e) {
            $tenant->delete(); // Rollback tenant creation on fail
            \Illuminate\Support\Facades\Log::error("Admin Import Error: " . $e->getMessage());
            return response()->json(['message' => 'Hata: ' . $e->getMessage()], 500);
        }
    }
}
