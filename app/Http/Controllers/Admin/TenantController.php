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
                'use_path_style_endpoint' => false,
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
        $tenants = Tenant::with('package')->withCount('users')->get();
        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'package_id' => 'required|exists:packages,id',
        ]);

        $s3Config = S3Config::where('is_active', true)->inRandomOrder()->first();

        if (!$s3Config) {
            return response()->json(['message' => 'Sistemde aktif S3 bağlantısı bulunamadı. Lütfen önce S3 ayarlarını yapılandırın.'], 400);
        }

        $package = \App\Models\Package::findOrFail($validated['package_id']);

        $tenant = Tenant::create([
            'id' => Str::uuid()->toString(),
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . rand(1000, 9999),
            's3_config_id' => $s3Config->id,
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
        ]);

        // Create as Paddle customer with trial
        $tenant->createAsCustomer([
            'trial_ends_at' => now()->addDays($package->trial_days),
        ]);

        return response()->json($tenant, 201);
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

        return response()->json(['message' => 'Tenant paketi güncellendi ve limitleri senkronize edildi.', 'tenant' => $tenant]);
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

        $user = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_approved' => true,
            'tenant_id' => $tenant->id,
        ]);

        return response()->json($user, 201);
    }

    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();

        return response()->json(['message' => 'Tenant deleted successfully']);
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
        
        // 2. Set as GIFTED and set long trial fallback
        $tenant->update([
            'trial_ends_at' => now()->addYears(100),
            'is_gifted' => true,
        ]);

        return response()->json([
            'message' => 'Paket sınırsız (100 yıl) süreyle tenant\'a başarıyla tanımlandı.',
            'tenant' => $tenant->load('package')
        ]);
    }
}
