<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\JobStatus;
use App\Models\StepTemplate;
use App\Models\Customer;
use App\Models\JobCrm;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\JobDetail;
use App\Models\JobFile;
use App\Models\JobStep;
use App\Models\CustomField;
use App\Models\DefaultStep;
use App\Models\ApiKey;
use App\Models\ActivityLog;
use App\Models\CustomFieldValue;
use App\Models\ExpenseCategory;
use App\Models\CashRegister;
use App\Models\Appointment;
use App\Models\AppointmentTitle;
use App\Models\Tenant;
use App\Models\Role;
use App\Models\User;
use App\Models\BackupKey;
use App\Models\Admin;
use App\Models\Proposal;
use App\Models\ProposalItem;
use App\Models\ProposalInstallment;
use App\Models\ProposalRevisionRequest;
use App\Models\ServiceTrackingCategory;
use App\Models\ServiceTracking;
use App\Models\ServiceTrackingLog;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use App\Services\ActivityLogService;

class BackupController extends Controller
{
    use HasTenantCache;

    private static $globalS3Disk = null;


    /**
     * Export all tenant data as a full ZIP (JSON + Files)
     */
    public function export(Request $request, \App\Services\TenantBackupService $service)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $tenant = Tenant::find($tenantId);
        $password = $request->query('password');

        $zipPath = $service->createBackupZip($tenantId, $password);
        
        $filename = \Illuminate\Support\Str::slug($tenant->name, '_') . '_full_backup_' . now()->timestamp . ".zip";
        
        ActivityLogService::log($request->user(), 'BACKUP', 'SYSTEM', null, 'Yedek Alındı', 'Sistem tam yedeği (Veri+Dosyalar) oluşturuldu: ' . $filename);

        return response()->download($zipPath, $filename)->deleteFileAfterSend();
    }

    /**
     * List backups directly from S3.
     */
    public function listS3Backups(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        try {
            $backupDir = "tenants/{$tenantId}/backups";
            $files = Storage::disk('s3_global')->files($backupDir);
            $backups = [];
            foreach ($files as $file) {
                if (Str::endsWith($file, '.json')) {
                    $basename = basename($file);
                    $backups[] = [
                        'name' => $basename,
                        'size' => Storage::disk('s3_global')->size($file),
                        'last_modified' => Storage::disk('s3_global')->lastModified($file),
                        'type' => Str::contains($basename, '_auto_') ? 'Otomatik' : 'Manuel',
                    ];
                }
            }

            usort($backups, fn($a, $b) => $b['last_modified'] <=> $a['last_modified']);

            return response()->json($backups);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("S3 Backup List error: " . $e->getMessage());
            return response()->json(['message' => 'Yedekler listelenirken S3 hatası oluştu.'], 500);
        }
    }

    /**
     * Download backup directly from S3
     */
    public function downloadS3Backup(Request $request)
    {
        $filename = $request->query('filename');
        if (!$filename) {
            return response()->json(['message' => 'Geçersiz dosya adı.'], 400);
        }

        $tenantId = $request->user()->tenant_id;

        try {
            $path = "tenants/{$tenantId}/backups/" . basename($filename);
            
            if (!Storage::disk('s3_global')->exists($path)) {
                return response()->json(['message' => 'Yedek dosyası S3 üzerinde bulunamadı.'], 404);
            }

            return Storage::disk('s3_global')->download($path);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("S3 Backup Download error: " . $e->getMessage());
            return response()->json(['message' => 'Yedek dosyası indirilirken hata oluştu.'], 500);
        }
    }

    /**
     * Import backup data (restore from ZIP)
     */
    public function import(Request $request, \App\Services\TenantBackupService $service): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:zip',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;

        try {
            $file = $request->file('file');
            $tempDir = storage_path('app/temp_backups');
            if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);
            
            $fileName = \Illuminate\Support\Str::random(40) . '.zip';
            $zipPath = $tempDir . '/' . $fileName;
            
            // Move uploaded file to temp storage for the Job
            $file->move($tempDir, $fileName);

            $tenant = \App\Models\Tenant::find($request->user()->tenant_id);
            $tenant->update(['is_restoring' => true]);

            // Dispatch background job
            \App\Jobs\ImportBackupJob::dispatch($zipPath, $tenant->id, $request->input('password'), $request->user()->id);

            return response()->json([
                'status' => 'success',
                'message' => 'Yedek geri yükleme işlemi arka planda başlatıldı. İşlem tamamlandığında sisteminiz açılacaktır.'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Import Error: " . $e->getMessage());
            return response()->json(['message' => 'Hata: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Clear all data for the current tenant
     */
    public function reset(Request $request, \App\Services\TenantBackupService $service): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $service->resetTenantData($tenantId, $request->user()->id);

        // Cache will be cleared by models if resetTenantData uses models, 
        // but since it probably uses direct DB deletes, we might need a manual clear.
        // Let's keep a global clear here for safety if resetTenantData is "deep".
        Cache::flush(); // Or more granularly increment all versions

        return response()->json(['message' => 'Tüm verileriniz başarıyla sıfırlandı.']);
    }
}
