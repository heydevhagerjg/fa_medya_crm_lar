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
use App\Services\ActivityLogService;

class BackupController extends Controller
{
    use HasTenantCache;

    private static $globalS3Disk = null;

    private function setGlobalS3Config()
    {
        if (self::$globalS3Disk !== null) {
            return true;
        }

        $admin = Admin::first();
        if (!$admin || !$admin->aws_access_key_id || !$admin->aws_secret_access_key || !$admin->aws_bucket_name) {
            return false;
        }

        $region = strtolower(trim($admin->aws_region ?? 'eu-central-1'));

        Storage::forgetDisk('s3_global');

        Config::set('filesystems.disks.s3_global', [
            'driver' => 's3',
            'key'    => trim($admin->aws_access_key_id),
            'secret' => trim($admin->aws_secret_access_key),
            'region' => $region,
            'bucket' => trim($admin->aws_bucket_name),
            'use_path_style_endpoint' => false,
            'url_encode_filenames' => true,
            'throw'  => true,
            'version' => 'latest'
        ]);

        self::$globalS3Disk = true;
        return true;
    }

    /**
     * Export all tenant data as JSON (the same format as Next.js backup)
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $services = Service::where('tenant_id', $tenantId)
            ->with('customFields')
            ->get()
            ->map(fn($s) => array_merge($s->toArray(), [
                'tenantId'    => $s->tenant_id,
                'customfield' => $s->customFields->map(fn($cf) => [
                    'id'        => $cf->id,
                    'serviceId' => $cf->service_id,
                    'label'     => $cf->label,
                    'type'      => $cf->type,
                    'required'  => $cf->required,
                    'order'     => $cf->order,
                    'createdAt' => $cf->created_at,
                    'updatedAt' => $cf->updated_at,
                ]),
            ]));

        $jobStatuses = JobStatus::where('tenant_id', $tenantId)
            ->orderBy('order')
            ->get()
            ->map(fn($s) => ['id' => $s->id, 'tenantId' => $s->tenant_id, 'name' => $s->name, 'color' => $s->color, 'order' => $s->order, 'createdAt' => $s->created_at, 'updatedAt' => $s->updated_at]);

        $stepTemplates = StepTemplate::where('tenant_id', $tenantId)
            ->with('defaultSteps')
            ->get()
            ->map(fn($t) => [
                'id'          => $t->id,
                'tenantId'    => $t->tenant_id,
                'name'        => $t->name,
                'createdAt'   => $t->created_at,
                'updatedAt'   => $t->updated_at,
                'defaultstep' => $t->defaultSteps->map(fn($ds) => ['id' => $ds->id, 'tenantId' => $ds->tenant_id, 'templateId' => $ds->template_id, 'title' => $ds->title, 'order' => $ds->order, 'createdAt' => $ds->created_at, 'updatedAt' => $ds->updated_at]),
            ]);

        $customers = Customer::where('tenant_id', $tenantId)
            ->get()
            ->map(fn($c) => ['id' => $c->id, 'tenantId' => $c->tenant_id, 'name' => $c->name, 'phone' => $c->phone, 'email' => $c->email, 'notes' => $c->notes, 'createdAt' => $c->created_at, 'updatedAt' => $c->updated_at]);

        $jobs = JobCrm::where('tenant_id', $tenantId)
            ->with(['jobDetail', 'jobFiles', 'jobSteps', 'payments', 'customFieldValues'])
            ->get()
            ->map(fn($j) => [
                'id'               => $j->id,
                'tenantId'         => $j->tenant_id,
                'customerId'       => $j->customer_id,
                'serviceId'        => $j->service_id,
                'jobStatusId'      => $j->job_status_id,
                'title'            => $j->title,
                'description'      => $j->description,
                'status'           => $j->status,
                'startDate'        => $j->start_date,
                'endDate'          => $j->end_date,
                'totalPrice'       => $j->total_price,
                'createdAt'        => $j->created_at,
                'updatedAt'        => $j->updated_at,
                'jobdetail'        => $j->jobDetail ? [
                    'customer_requests' => $j->jobDetail->customer_requests,
                    'notes'             => $j->jobDetail->notes,
                ] : null,
                'jobfile'          => $j->jobFiles->map(fn($f) => ['id' => $f->id, 'jobId' => $f->job_id, 'fileName' => $f->file_name, 'filePath' => $f->file_path, 'fileType' => $f->file_type, 'fileSize' => $f->file_size, 'uploadedAt' => $f->uploaded_at]),
                'jobstep'          => $j->jobSteps->map(fn($s) => ['id' => $s->id, 'jobId' => $s->job_id, 'title' => $s->title, 'isCompleted' => $s->is_completed, 'order' => $s->order, 'createdAt' => $s->created_at, 'updatedAt' => $s->updated_at]),
                'payment'          => $j->payments->map(fn($p) => ['id' => $p->id, 'tenantId' => $p->tenant_id, 'jobId' => $p->job_id, 'amount' => $p->amount, 'paymentDate' => $p->payment_date, 'paymentType' => $p->payment_type, 'description' => $p->description, 'cashRegisterId' => $p->cash_register_id, 'createdAt' => $p->created_at, 'updatedAt' => $p->updated_at]),
                'customfieldvalue' => $j->customFieldValues->map(fn($v) => ['id' => $v->id, 'jobId' => $v->job_id, 'customFieldId' => $v->custom_field_id, 'value' => $v->value, 'createdAt' => $v->created_at, 'updatedAt' => $v->updated_at]),
            ]);

        $expenses = Expense::where('tenant_id', $tenantId)
            ->get()
            ->map(fn($e) => ['id' => $e->id, 'tenantId' => $e->tenant_id, 'jobId' => $e->job_id, 'categoryId' => $e->category_id, 'title' => $e->title, 'amount' => $e->amount, 'date' => $e->date, 'description' => $e->description, 'createdAt' => $e->created_at, 'updatedAt' => $e->updated_at, 'cashRegisterId' => $e->cash_register_id]);

        $apiKeys = ApiKey::where('tenant_id', $tenantId)->get()->map(fn($k) => ['id' => $k->id, 'key' => $k->key, 'name' => $k->name, 'tenantId' => $k->tenant_id, 'createdAt' => $k->created_at, 'lastUsed' => $k->last_used]);

        $activityLogs = ActivityLog::where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->limit(300)
            ->get()
            ->map(fn($l) => [
                'id' => $l->id, 
                'tenantId' => $l->tenant_id, 
                'userId' => $l->user_id, 
                'action' => $l->action, 
                'entityType' => $l->entity_type, 
                'entityId' => $l->entity_id, 
                'entityName' => $l->entity_name, 
                'details' => $l->details, 
                'createdAt' => $l->created_at
            ]);

        $expenseCategories = ExpenseCategory::where('tenant_id', $tenantId)->get()->map(fn($c) => ['id' => $c->id, 'name' => $c->name, 'tenantId' => $c->tenant_id]);

        $cashRegisters = CashRegister::where('tenant_id', $tenantId)->get()->map(fn($cr) => ['id' => $cr->id, 'name' => $cr->name, 'is_default' => $cr->is_default]);
        
        $appointments = Appointment::where('tenant_id', $tenantId)->get()->map(fn($a) => [
            'id' => $a->id,
            'tenantId' => $a->tenant_id,
            'customerId' => $a->customer_id,
            'title' => $a->title,
            'description' => $a->description,
            'startTime' => $a->start_time,
            'endTime' => $a->end_time,
            'status' => $a->status,
            'createdAt' => $a->created_at,
            'updatedAt' => $a->updated_at
        ]);

        $appointmentTitles = AppointmentTitle::where('tenant_id', $tenantId)->get()->map(fn($at) => [
            'id' => $at->id,
            'tenantId' => $at->tenant_id,
            'name' => $at->name,
            'createdAt' => $at->created_at,
            'updatedAt' => $at->updated_at
        ]);

        $serviceTrackingCategories = ServiceTrackingCategory::where('tenant_id', $tenantId)->get()->map(fn($c) => [
            'id' => $c->id,
            'tenantId' => $c->tenant_id,
            'name' => $c->name,
            'createdAt' => $c->created_at,
            'updatedAt' => $c->updated_at
        ]);

        $serviceTrackings = ServiceTracking::withoutGlobalScope('active')->where('tenant_id', $tenantId)->get()->map(fn($t) => [
            'id' => $t->id,
            'tenantId' => $t->tenant_id,
            'categoryId' => $t->category_id,
            'customerId' => $t->customer_id,
            'jobId' => $t->job_id,
            'title' => $t->title,
            'description' => $t->description,
            'period' => $t->period,
            'periodUnit' => $t->period_unit,
            'startDate' => $t->start_date,
            'nextDate' => $t->next_date,
            'status' => $t->status,
            'createdAt' => $t->created_at,
            'updatedAt' => $t->updated_at
        ]);

        $serviceTrackingLogs = ServiceTrackingLog::where('tenant_id', $tenantId)->get()->map(fn($l) => [
            'id' => $l->id,
            'tenantId' => $l->tenant_id,
            'serviceTrackingId' => $l->service_tracking_id,
            'plannedDate' => $l->planned_date,
            'completedAt' => $l->completed_at,
            'status' => $l->status,
            'notes' => $l->notes,
            'createdAt' => $l->created_at,
            'updatedAt' => $l->updated_at
        ]);


        $roles = Role::where('tenant_id', $tenantId)
            ->with('permissions')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'permissions' => $r->permissions->pluck('name')->toArray()
            ]);

        $tenant = Tenant::find($tenantId);

        $backup = [
            'version'   => '2.2',
            'timestamp' => now()->toISOString(),
            'tenantId'  => $tenantId,
            'data'      => [
                'services'       => $services,
                'jobstatuses'    => $jobStatuses,
                'steptemplates'  => $stepTemplates,
                'customers'      => $customers,
                'jobs'              => $jobs,
                'expenses'          => $expenses,
                'expensecategories' => $expenseCategories,
                'cash_registers'    => $cashRegisters,
                'apikeys'           => $apiKeys,
                'activitylogs'      => $activityLogs,
                'appointments'      => $appointments,
                'appointment_titles'=> $appointmentTitles,
                'service_tracking_categories' => $serviceTrackingCategories,
                'service_trackings' => $serviceTrackings,
                'service_tracking_logs' => $serviceTrackingLogs,
                'roles'             => $roles,
            ],
            'tenant_settings' => [],
            'exported_from' => 'famedya_crm',
        ];

        $newImportKey = Str::random(40);
        \App\Models\BackupKey::create([
            'tenant_id' => $tenantId,
            'key'       => $newImportKey,
            'name'      => 'Yedek - ' . now()->format('d.m.Y H:i')
        ]);

        $backup['import_key'] = $newImportKey;
        $jsonContent = json_encode($backup, JSON_UNESCAPED_UNICODE);
        $filename = Str::slug($tenant->name ?? 'yedek', '_') . '_' . now()->timestamp . ".json";

        if ($this->setGlobalS3Config()) {
            try {
                Storage::disk('s3_global')->put("tenants/{$tenantId}/backups/{$filename}", $jsonContent);
                ActivityLogService::log($request->user(), 'BACKUP', 'SYSTEM', null, 'Yedek Alındı', 'Sistem yedeği AWS S3 üzerine aktarıldı: ' . $filename);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("S3 Backup upload failed: " . $e->getMessage());
            }
        }

        return response($jsonContent)
            ->header('Content-Type', 'application/json')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * List backups directly from S3.
     */
    public function listS3Backups(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        if (!$this->setGlobalS3Config()) {
            return response()->json(['message' => 'Yöneticisin depolama ayarlarını kontrol etmeli (S3 Yapılandırılmamış).'], 400);
        }

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

        if (!$this->setGlobalS3Config()) {
            return response()->json(['message' => 'Yöneticisin depolama ayarlarını kontrol etmeli (S3 Yapılandırılmamış).'], 400);
        }

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
     * Import backup data (restore from JSON)
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:json',
        ]);

        $content = file_get_contents($request->file('file')->getRealPath());
        $backup = json_decode($content, true);

        if (!$backup || !isset($backup['data'])) {
            return response()->json(['message' => 'Geçersiz yedek dosyası.'], 422);
        }

        $user = $request->user();
        $tenantId = $user->tenant_id;
        $tenant = Tenant::find($tenantId);

        // Security check
        $isFamedyaExport = isset($backup['exported_from']) && $backup['exported_from'] === 'famedya_crm';
        $hasCorrectKey = false;
        $importKeyFromBackup = $backup['import_key'] ?? null;

        if ($importKeyFromBackup) {
            $hasCorrectKey = \App\Models\BackupKey::where('tenant_id', $tenantId)
                ->where('key', $importKeyFromBackup)
                ->exists();
        }

        if (!$isFamedyaExport || !$hasCorrectKey) {
            return response()->json([
                'message' => 'Geçersiz veya yetkisiz yedek dosyası. Lütfen JSON dosyasının bu CRM sisteminden dışa aktarıldığından ve Özel İmport Key kaydının geçerli olduğundan emin olun.'
            ], 403);
        }

        $data = $backup['data'];
        $settings = $backup['tenant_settings'] ?? [];

        \Illuminate\Database\Eloquent\Model::unguard();
        try {
            DB::transaction(function () use ($data, $tenantId, $settings, $user) {
                // Restore Tenant Settings (S3 no longer restored here)


                // Import services & custom fields
                $serviceIdMap = [];
                $customFieldIdMap = [];
                foreach (($data['services'] ?? []) as $s) {
                    $service = Service::updateOrCreate(
                        ['tenant_id' => $tenantId, 'name' => $s['name']],
                        ['config' => $s['config'] ?? '{}', 'created_at' => $s['createdAt'] ?? now(), 'updated_at' => $s['updatedAt'] ?? now()]
                    );
                    $serviceIdMap[$s['id']] = $service->id;

                    foreach (($s['customfield'] ?? []) as $cf) {
                        $newCf = $service->customFields()->updateOrCreate(
                            ['label' => $cf['label'], 'service_id' => $service->id],
                            ['type' => $cf['type'], 'required' => $cf['required'] ?? false, 'order' => $cf['order'] ?? 0, 'created_at' => $cf['createdAt'] ?? now(), 'updated_at' => $cf['updatedAt'] ?? now()]
                        );
                        if (isset($cf['id'])) {
                            $customFieldIdMap[$cf['id']] = $newCf->id;
                        }
                    }
                }

                // Import roles
                foreach (($data['roles'] ?? []) as $r) {
                    $role = Role::updateOrCreate(
                        ['tenant_id' => $tenantId, 'name' => $r['name']],
                        ['guard_name' => 'web']
                    );
                    if (!empty($r['permissions'])) {
                        $role->syncPermissions($r['permissions']);
                    }
                }


                // Import job statuses
                $statusIdMap = [];
                foreach (($data['jobstatuses'] ?? []) as $s) {
                    $status = JobStatus::updateOrCreate(
                        ['tenant_id' => $tenantId, 'name' => $s['name']],
                        ['color' => $s['color'], 'order' => $s['order'] ?? 0, 'created_at' => $s['createdAt'] ?? now(), 'updated_at' => $s['updatedAt'] ?? now()]
                    );
                    $statusIdMap[$s['id']] = $status->id;
                }

            // Import step templates
            foreach (($data['steptemplates'] ?? []) as $t) {
                $template = StepTemplate::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $t['name']],
                    ['created_at' => $t['createdAt'] ?? now(), 'updated_at' => $t['updatedAt'] ?? now()]
                );
                foreach (($t['defaultstep'] ?? []) as $step) {
                    $template->defaultSteps()->updateOrCreate(
                        ['title' => $step['title'], 'template_id' => $template->id],
                        ['order' => $step['order'] ?? 0, 'tenant_id' => $tenantId, 'created_at' => $step['createdAt'] ?? now(), 'updated_at' => $step['updatedAt'] ?? now()]
                    );
                }
            }

            // Import customers
            $customerIdMap = [];
            foreach (($data['customers'] ?? []) as $c) {
                $customer = Customer::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $c['name'], 'phone' => $c['phone']],
                    ['email' => $c['email'], 'notes' => $c['notes'], 'created_at' => $c['createdAt'] ?? now(), 'updated_at' => $c['updatedAt'] ?? now()]
                );
                $customerIdMap[$c['id']] = $customer->id;
            }

            // Import jobs
            $jobIdMap = [];
            foreach (($data['jobs'] ?? []) as $j) {
                $customerId = $customerIdMap[$j['customerId']] ?? null;
                if (!$customerId) continue;

                $jsId = (isset($j['jobStatusId']) && isset($statusIdMap[$j['jobStatusId']])) ? $statusIdMap[$j['jobStatusId']] : null;
                
                if (!$jsId) {
                    // Try to pick first status for tenant
                    $ds = JobStatus::where('tenant_id', $tenantId)->orderBy('order')->first();
                    if (!$ds) {
                        $ds = JobStatus::create([
                            'tenant_id' => $tenantId,
                            'name'      => 'Varsayılan',
                            'color'     => '#6366f1',
                            'order'     => 0,
                        ]);
                    }
                    $jsId = $ds->id;
                }

                $job = JobCrm::updateOrCreate(
                    ['tenant_id' => $tenantId, 'title' => $j['title'], 'customer_id' => $customerId],
                    [
                        'service_id'    => isset($j['serviceId']) && isset($serviceIdMap[$j['serviceId']]) ? $serviceIdMap[$j['serviceId']] : null,
                        'job_status_id' => $jsId,
                        'description'   => $j['description'],
                        'status'        => $j['status'] ?? 'PENDING',
                        'start_date'    => isset($j['startDate']) ? substr($j['startDate'], 0, 10) : now()->toDateString(),
                        'end_date'      => isset($j['endDate']) ? substr($j['endDate'], 0, 10) : null,
                        'total_price'   => $j['totalPrice'] ?? 0,
                        'user_id'       => $j['userId'] ?? $j['user_id'] ?? null,
                        'created_at'    => $j['createdAt'] ?? now(),
                        'updated_at'    => $j['updatedAt'] ?? now(),
                    ]
                );
                $jobIdMap[$j['id']] = $job->id;

                // Restore job detail
                if (!empty($j['jobdetail'])) {
                    $job->jobDetail()->updateOrCreate(
                        ['job_id' => $job->id],
                        [
                            'customer_requests' => $j['jobdetail']['customer_requests'] ?? $j['jobdetail']['customerRequests'] ?? null, 
                            'notes'             => $j['jobdetail']['notes'] ?? null
                        ]
                    );
                }

                // Restore job steps
                if (!empty($j['jobstep'])) {
                    $job->jobSteps()->delete();
                    foreach ($j['jobstep'] as $step) {
                        $job->jobSteps()->create(['title' => $step['title'], 'is_completed' => $step['isCompleted'] ?? false, 'order' => $step['order'] ?? 0, 'created_at' => $step['createdAt'] ?? now(), 'updated_at' => $step['updatedAt'] ?? now()]);
                    }
                }

                // Restore job files
                if (!empty($j['jobfile'])) {
                    $job->jobFiles()->delete();
                    foreach ($j['jobfile'] as $file) {
                        $job->jobFiles()->create([
                            'file_name' => $file['fileName'] ?? $file['file_name'] ?? 'unknown',
                            'file_path' => $file['filePath'] ?? $file['file_path'] ?? '',
                            'file_type' => $file['fileType'] ?? $file['file_type'] ?? 'application/octet-stream',
                            'file_size' => $file['fileSize'] ?? $file['file_size'] ?? 0,
                            'uploaded_at' => $file['uploadedAt'] ?? $file['uploaded_at'] ?? now(),
                        ]);
                    }
                }

                // Restore custom field values
                if (!empty($j['customfieldvalue'])) {
                    $job->customFieldValues()->delete();
                    foreach ($j['customfieldvalue'] as $cfv) {
                        $oldCfId = $cfv['customFieldId'] ?? $cfv['custom_field_id'] ?? null;
                        $newCfId = $oldCfId && isset($customFieldIdMap[$oldCfId]) ? $customFieldIdMap[$oldCfId] : null;

                        if ($newCfId) {
                            $job->customFieldValues()->create([
                                'custom_field_id' => $newCfId,
                                'value'           => $cfv['value'] ?? '',
                                'created_at'      => $cfv['createdAt'] ?? now(),
                                'updated_at'      => $cfv['updatedAt'] ?? now(),
                            ]);
                        }
                    }
                }
            }

            // Import expense categories
            $expenseCategoryIdMap = [];
            $allCategorySources = [
                $data['expensecategories'] ?? [],
                $data['expenseCategories'] ?? [],
                $data['expense_categories'] ?? [],
                $data['categories'] ?? []
            ];

            foreach ($allCategorySources as $source) {
                foreach ($source as $ec) {
                    $catName = $ec['name'] ?? $ec['label'] ?? $ec['title'] ?? null;
                    if (!$catName) continue;

                    $category = ExpenseCategory::updateOrCreate(
                        ['tenant_id' => $tenantId, 'name' => $catName],
                        ['created_at' => $ec['createdAt'] ?? now(), 'updated_at' => $ec['updatedAt'] ?? now()]
                    );
                    
                    $oldId = $ec['id'] ?? $ec['categoryId'] ?? $ec['category_id'] ?? null;
                    if ($oldId) {
                        $expenseCategoryIdMap[$oldId] = $category->id;
                    }
                }
            }

            // Import cash registers
            $cashRegisterIdMap = [];
            $allRegisterSources = [
                $data['cash_registers'] ?? [],
                $data['cash_register'] ?? [],
                $data['cashRegisters'] ?? [],
                $data['cashregisters'] ?? [],
                $data['registers'] ?? []
            ];

            foreach ($allRegisterSources as $source) {
                foreach ($source as $cr) {
                    $regName = $cr['name'] ?? $cr['label'] ?? $cr['title'] ?? null;
                    if (!$regName) continue;

                    $cashRegister = CashRegister::updateOrCreate(
                        ['tenant_id' => $tenantId, 'name' => $regName],
                        ['is_default' => $cr['is_default'] ?? $cr['isDefault'] ?? false, 'created_at' => $cr['createdAt'] ?? now(), 'updated_at' => $cr['updatedAt'] ?? now()]
                    );
                    
                    $oldId = $cr['id'] ?? $cr['cashRegisterId'] ?? $cr['cash_register_id'] ?? null;
                    if ($oldId) {
                        $cashRegisterIdMap[$oldId] = $cashRegister->id;
                    }
                }
            }

            // Restore payments nested in jobs
            foreach (($data['jobs'] ?? []) as $j) {
                $jobId = $jobIdMap[$j['id']] ?? null;
                if (!$jobId) continue;
                
                $payments = $j['payment'] ?? $j['payments'] ?? [];
                if (empty($payments)) continue;

                foreach ($payments as $p) {
                    $oldCRId = $p['cashRegisterId'] ?? $p['cash_register_id'] ?? null;
                    $cashRegisterId = $oldCRId && isset($cashRegisterIdMap[$oldCRId]) ? $cashRegisterIdMap[$oldCRId] : null;
                    $pDate = $p['paymentDate'] ?? $p['payment_date'] ?? now()->toDateString();
                    $pAmount = $p['amount'] ?? 0;

                    Payment::updateOrCreate(
                        ['tenant_id' => $tenantId, 'job_id' => $jobId, 'payment_date' => substr($pDate, 0, 10), 'amount' => $pAmount],
                        [
                            'payment_type'     => $p['paymentType'] ?? $p['payment_type'] ?? 'CASH',
                            'description'      => $p['description'] ?? null,
                            'cash_register_id' => $cashRegisterId,
                            'created_at'       => $p['createdAt'] ?? now(),
                            'updated_at'       => $p['updatedAt'] ?? now(),
                        ]
                    );
                }
            }

            // Import Appointment Titles
            foreach (($data['appointment_titles'] ?? []) as $at) {
                AppointmentTitle::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $at['name']],
                    ['created_at' => $at['createdAt'] ?? now(), 'updated_at' => $at['updatedAt'] ?? now()]
                );
            }

            // Import Appointments
            foreach (($data['appointments'] ?? []) as $a) {
                $customerId = isset($a['customerId']) && isset($customerIdMap[$a['customerId']]) ? $customerIdMap[$a['customerId']] : null;
                if (!$customerId) continue;

                Appointment::updateOrCreate(
                    ['tenant_id' => $tenantId, 'customer_id' => $customerId, 'start_time' => $a['startTime']],
                    [
                        'title'       => $a['title'],
                        'description' => $a['description'] ?? null,
                        'end_time'    => $a['endTime'] ?? null,
                        'status'      => $a['status'] ?? 'PENDING',
                        'created_at'  => $a['createdAt'] ?? now(),
                        'updated_at'  => $a['updatedAt'] ?? now(),
                    ]
                );
            }

            // Import Service Tracking Categories
            $stCategoryIdMap = [];
            foreach (($data['service_tracking_categories'] ?? []) as $stc) {
                $category = ServiceTrackingCategory::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $stc['name']],
                    ['created_at' => $stc['createdAt'] ?? now(), 'updated_at' => $stc['updatedAt'] ?? now()]
                );
                $stCategoryIdMap[$stc['id']] = $category->id;
            }

            // Import Service Trackings
            $stIdMap = [];
            foreach (($data['service_trackings'] ?? []) as $st) {
                $stCategoryId = isset($st['categoryId']) && isset($stCategoryIdMap[$st['categoryId']]) ? $stCategoryIdMap[$st['categoryId']] : null;
                if (!$stCategoryId) continue;

                $stCustomerId = isset($st['customerId']) && isset($customerIdMap[$st['customerId']]) ? $customerIdMap[$st['customerId']] : null;
                $stJobId = isset($st['jobId']) && isset($jobIdMap[$st['jobId']]) ? $jobIdMap[$st['jobId']] : null;

                $serviceTracking = ServiceTracking::updateOrCreate(
                    ['tenant_id' => $tenantId, 'category_id' => $stCategoryId, 'title' => $st['title'], 'customer_id' => $stCustomerId, 'job_id' => $stJobId],
                    [
                        'description' => $st['description'] ?? null,
                        'period' => $st['period'] ?? 1,
                        'period_unit' => $st['periodUnit'] ?? $st['period_unit'] ?? 'month',
                        'start_date' => $st['startDate'] ?? $st['start_date'] ?? now()->toDateString(),
                        'next_date' => $st['nextDate'] ?? $st['next_date'] ?? null,
                        'status' => $st['status'] ?? 'active',
                        'created_at' => $st['createdAt'] ?? now(),
                        'updated_at' => $st['updatedAt'] ?? now(),
                    ]
                );
                $stIdMap[$st['id']] = $serviceTracking->id;
            }

            // Import Service Tracking Logs
            foreach (($data['service_tracking_logs'] ?? []) as $stl) {
                $stId = isset($stl['serviceTrackingId']) && isset($stIdMap[$stl['serviceTrackingId']]) ? $stIdMap[$stl['serviceTrackingId']] : null;
                if (!$stId) continue;

                ServiceTrackingLog::updateOrCreate(
                    ['tenant_id' => $tenantId, 'service_tracking_id' => $stId, 'planned_date' => $stl['plannedDate']],
                    [
                        'completed_at' => $stl['completedAt'] ?? null,
                        'status' => $stl['status'] ?? 'completed',
                        'notes' => $stl['notes'] ?? null,
                        'created_at' => $stl['createdAt'] ?? now(),
                        'updated_at' => $stl['updatedAt'] ?? now(),
                    ]
                );
            }

            // Import expenses
            foreach (($data['expenses'] ?? []) as $e) {
                $oldJobId = $e['jobId'] ?? $e['job_id'] ?? null;
                $jobId = $oldJobId && isset($jobIdMap[$oldJobId]) ? $jobIdMap[$oldJobId] : null;
                
                $oldCRId = $e['cashRegisterId'] ?? $e['cash_register_id'] ?? null;
                $cashRegisterId = $oldCRId && isset($cashRegisterIdMap[$oldCRId]) ? $cashRegisterIdMap[$oldCRId] : null;
                
                $oldCatId = $e['categoryId'] ?? $e['category_id'] ?? null;
                $categoryId = $oldCatId && isset($expenseCategoryIdMap[$oldCatId]) ? $expenseCategoryIdMap[$oldCatId] : null;
                
                $eDate = $e['date'] ?? now()->toDateString();
                $eAmount = $e['amount'] ?? 0;

                Expense::updateOrCreate(
                    ['tenant_id' => $tenantId, 'title' => $e['title'], 'date' => substr($eDate, 0, 10), 'amount' => $eAmount],
                    [
                        'job_id'           => $jobId,
                        'description'      => $e['description'] ?? null,
                        'category_id'      => $categoryId,
                        'cash_register_id' => $cashRegisterId,
                        'created_at'       => $e['createdAt'] ?? now(),
                        'updated_at'       => $e['updatedAt'] ?? now(),
                    ]
                );
            }

            // Import Activity Logs
            foreach (($data['activitylogs'] ?? $data['activity_logs'] ?? []) as $l) {
                ActivityLog::create([
                    'tenant_id'   => $tenantId,
                    'user_id'     => $l['userId'] ?? $l['user_id'] ?? $user->id,
                    'action'      => $l['action'] ?? 'BACKUP_IMPORT',
                    'entity_type' => $l['entityType'] ?? $l['entity_type'] ?? 'SYSTEM',
                    'entity_id'   => $l['entityId'] ?? $l['entity_id'] ?? null,
                    'entity_name' => $l['entityName'] ?? $l['entity_name'] ?? '',
                    'details'     => $l['details'] ?? '',
                    'created_at'  => $l['createdAt'] ?? $l['created_at'] ?? now(),
                ]);
            }
        });
    } finally {
        \Illuminate\Database\Eloquent\Model::reguard();
    }

        // Clear all tenant caches after restore
        $this->clearTenantCache('jobs');
        $this->clearTenantCache('customers');
        $this->clearTenantCache('services');
        $this->clearTenantCache('statuses');
        $this->clearTenantCache('expenses');
        $this->clearTenantCache('payments');
        $this->clearTenantCache('appointments');
        $this->clearTenantCache('cash_registers');
        $this->clearTenantCache('service_trackings');

        return response()->json(['message' => 'Yedek başarıyla içe aktarıldı.']);
    }

    /**
     * Clear all data for the current tenant
     */
    public function reset(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        DB::transaction(function () use ($tenantId, $request) {
            // Delete jobs and their related data
            $jobIds = JobCrm::where('tenant_id', $tenantId)->pluck('id');
            
            JobDetail::whereIn('job_id', $jobIds)->delete();
            JobFile::whereIn('job_id', $jobIds)->delete();
            JobStep::whereIn('job_id', $jobIds)->delete();
            CustomFieldValue::whereIn('job_id', $jobIds)->delete();
            Payment::whereIn('job_id', $jobIds)->delete();
            Expense::whereIn('job_id', $jobIds)->delete();
            JobCrm::where('tenant_id', $tenantId)->delete();

            // Delete customers
            Customer::where('tenant_id', $tenantId)->delete();

            // Delete specific settings
            Payment::where('tenant_id', $tenantId)->delete(); // Catch-all for tenant payments
            Expense::where('tenant_id', $tenantId)->delete(); // Catch-all for tenant expenses
            CashRegister::where('tenant_id', $tenantId)->delete();
            ExpenseCategory::where('tenant_id', $tenantId)->delete();
            
            // Delete service configurations
            $serviceIds = Service::where('tenant_id', $tenantId)->pluck('id');
            CustomField::whereIn('service_id', $serviceIds)->delete();
            Service::where('tenant_id', $tenantId)->delete();

            // Delete job status configurations
            JobStatus::where('tenant_id', $tenantId)->delete();

            // Delete step templates
            $templateIds = StepTemplate::where('tenant_id', $tenantId)->pluck('id');
            DefaultStep::whereIn('template_id', $templateIds)->delete();
            StepTemplate::where('tenant_id', $tenantId)->delete();

            // Delete activity logs and api keys
            ActivityLog::where('tenant_id', $tenantId)->delete();
            ApiKey::where('tenant_id', $tenantId)->delete();
            Appointment::where('tenant_id', $tenantId)->delete();
            AppointmentTitle::where('tenant_id', $tenantId)->delete();
            ServiceTrackingLog::where('tenant_id', $tenantId)->delete();
            ServiceTracking::where('tenant_id', $tenantId)->delete();
            ServiceTrackingCategory::where('tenant_id', $tenantId)->delete();

            // Delete roles and personnel (except the one doing the reset)
            Role::where('tenant_id', $tenantId)->delete();
            User::where('tenant_id', $tenantId)->where('id', '!=', $request->user()->id)->delete();
        });

        // Clear all tenant caches after reset
        $this->clearTenantCache('jobs');
        $this->clearTenantCache('customers');
        $this->clearTenantCache('services');
        $this->clearTenantCache('statuses');
        $this->clearTenantCache('expenses');
        $this->clearTenantCache('payments');
        $this->clearTenantCache('appointments');
        $this->clearTenantCache('cash_registers');
        $this->clearTenantCache('service_trackings');

        return response()->json(['message' => 'Tüm verileriniz başarıyla sıfırlandı.']);
    }
}
