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
use App\Models\AdminNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;

class BackupController extends Controller
{
    use HasTenantCache;


    /**
     * Request a full backup from the admin
     */
    public function requestBackup(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $tenant = Tenant::findOrFail($tenantId);

        $tenant->update(['backup_requested' => true]);

        ActivityLogService::log($request->user(), 'BACKUP_REQUEST', 'SYSTEM', null, 'Yedek Talebi', 'Tam yedek alma talebi admin panelinde oluşturuldu.');

        // Send notification to all admins
        $admins = Admin::all();
        foreach ($admins as $admin) {
            AdminNotification::create([
                'admin_id' => $admin->id,
                'type' => 'backup_request',
                'title' => 'Yedekleme Talebi',
                'message' => $tenant->name . ' kullanıcısı yedekleme talep etti.',
                'data' => [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'requested_at' => now(),
                ]
            ]);
        }

        return response()->json(['message' => 'Yedekleme talebiniz alınmıştır. Yedeğiniz hazır olduğunda burada listelenecektir.']);
    }

    /**
     * Clear backup request
     */
    public function cancelRequest(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $tenant = Tenant::findOrFail($tenantId);
        $tenant->update(['backup_requested' => false]);
        return response()->json(['message' => 'Yedekleme talebi iptal edildi.']);
    }

    /**
     * Delete a specific backup
     */
    public function deleteAppBackup(Request $request, $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $backup = \App\Models\TenantBackup::where('tenant_id', $tenantId)->findOrFail($id);

        // Delete the file if it exists
        if ($backup->path && \Illuminate\Support\Facades\File::exists(storage_path('app/' . $backup->path))) {
            \Illuminate\Support\Facades\File::delete(storage_path('app/' . $backup->path));
        }

        $backup->delete();

        return response()->json(['message' => 'Yedek silindi.']);
    }

    /**
     * List backups created by admin for this tenant
     */
    public function listAppBackups(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $backups = \App\Models\TenantBackup::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->latest()
            ->get()
            ->map(function ($b) {
            return [
            'id' => $b->id,
            'filename' => $b->filename,
            'size' => $b->size,
            'created_at' => $b->created_at,
            'has_file' => $b->path && \Illuminate\Support\Facades\File::exists(storage_path('app/' . $b->path))
            ];
        });

        $tenant = \App\Models\Tenant::find($tenantId);

        return response()->json([
            'backups' => $backups,
            'backup_requested' => $tenant->backup_requested ?? false
        ]);
    }

    /**
     * Download a specific backup record
     */
    public function downloadAppBackup(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;
        $backup = \App\Models\TenantBackup::where('tenant_id', $tenantId)->findOrFail($id);

        if ($backup->status !== 'completed') {
            return response()->json(['params' => 'Yedek henüz tamamlanmadı.'], 400);
        }

        $filePath = storage_path('app/' . $backup->path);

        if (!\Illuminate\Support\Facades\File::exists($filePath)) {
            return response()->json(['message' => 'Dosya sistemde bulunamadı.'], 404);
        }

        return response()->download($filePath, $backup->filename);
    }

    /**
     * Generate a temporary signed URL for large file download
     */
    public function getSignedUrl(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;
        // Verify ownership
        \App\Models\TenantBackup::where('tenant_id', $tenantId)->findOrFail($id);

        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'backup.download.public',
            now()->addMinutes(15),
        ['id' => $id]
        );

        return response()->json(['url' => $url]);
    }

    /**
     * Public download via signed URL
     */
    public function downloadPublicBackup($id)
    {
        $backup = \App\Models\TenantBackup::findOrFail($id);

        if ($backup->status !== 'completed') {
            abort(400, 'Yedek henüz tamamlanmadı.');
        }

        $filePath = storage_path('app/' . $backup->path);

        if (!\Illuminate\Support\Facades\File::exists($filePath)) {
            abort(404, 'Dosya bulunamadı.');
        }

        return response()->download($filePath, $backup->filename);
    }

    /**
     * Export all tenant data as a full ZIP (JSON + Files)
     */
    public function export(Request $request, \App\Services\TenantBackupService $service)
    {
        return $this->requestBackup($request);
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
            if (!file_exists($tempDir))
                mkdir($tempDir, 0755, true);

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
        }
        catch (\Exception $e) {
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
