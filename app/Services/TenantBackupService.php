<?php

namespace App\Services;

use App\Models\Service;
use App\Models\JobStatus;
use App\Models\StepTemplate;
use App\Models\Customer;
use App\Models\JobCrm;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\ApiKey;
use App\Models\ActivityLog;
use App\Models\ExpenseCategory;
use App\Models\CashRegister;
use App\Models\Appointment;
use App\Models\AppointmentTitle;
use App\Models\Tenant;
use App\Models\Role;
use App\Models\Proposal;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\ServiceTrackingCategory;
use App\Models\ServiceTracking;
use App\Models\ServiceTrackingLog;
use App\Models\User;

class TenantBackupService
{
    use \App\Traits\S3GlobalConfigTrait;

    public function generateBackupData($tenantId, $includeUsers = true)
    {
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
                'subtotal'         => $j->subtotal,
                'vat'              => $j->is_vat_included,
                'vatAmount'        => $j->vat_amount,
                'vatRate'          => $j->vat_rate,
                'proposalId'       => $j->proposal_id,
                'userId'           => $j->user_id,
                'order'            => $j->order,
                'createdAt'        => $j->created_at,
                'updatedAt'        => $j->updated_at,
                'jobdetail'        => $j->jobDetail ? [
                    'customer_requests' => $j->jobDetail->customer_requests,
                    'notes'             => $j->jobDetail->notes,
                ] : null,
                'jobfile'          => $j->jobFiles->map(fn($f) => ['id' => $f->id, 'jobId' => $f->job_id, 'fileName' => $f->file_name, 'filePath' => $f->file_path, 'fileType' => $f->file_type, 'fileSize' => $f->file_size, 'uploadedAt' => $f->uploaded_at]),
                'jobstep'          => $j->jobSteps->map(fn($s) => ['id' => $s->id, 'jobId' => $s->job_id, 'title' => $s->title, 'isCompleted' => $s->is_completed, 'order' => $s->order, 'createdAt' => $s->created_at, 'updatedAt' => $s->updated_at]),
                'payment'          => $j->payments->map(fn($p) => ['id' => $p->id, 'tenantId' => $p->tenant_id, 'jobId' => $p->job_id, 'amount' => $p->amount, 'paymentDate' => $p->payment_date, 'paymentType' => $p->payment_type, 'description' => $p->description, 'cashRegisterId' => $p->cash_register_id, 'receiptPath' => $p->receipt_path, 'createdAt' => $p->created_at, 'updatedAt' => $p->updated_at]),
                'customfieldvalue' => $j->customFieldValues->map(fn($v) => ['id' => $v->id, 'jobId' => $v->job_id, 'customFieldId' => $v->custom_field_id, 'value' => $v->value, 'createdAt' => $v->created_at, 'updatedAt' => $v->updated_at]),
            ]);

        $expenses = Expense::where('tenant_id', $tenantId)
            ->get()
            ->map(fn($e) => ['id' => $e->id, 'tenantId' => $e->tenant_id, 'jobId' => $e->job_id, 'categoryId' => $e->category_id, 'title' => $e->title, 'amount' => $e->amount, 'date' => $e->date, 'description' => $e->description, 'receiptPath' => $e->receipt_path, 'createdAt' => $e->created_at, 'updatedAt' => $e->updated_at, 'cashRegisterId' => $e->cash_register_id]);

        $proposals = Proposal::where('tenant_id', $tenantId)
            ->with(['items', 'installments', 'revisionRequests'])
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'uuid' => $p->uuid,
                'tenantId' => $p->tenant_id,
                'customerId' => $p->customer_id,
                'serviceId' => $p->service_id,
                'title' => $p->title,
                'description' => $p->description,
                'totalPrice' => $p->total_price,
                'subtotal' => $p->subtotal,
                'vatAmount' => $p->vat_amount,
                'isVatIncluded' => $p->is_vat_included,
                'vatRate' => $p->vat_rate,
                'status' => $p->status,
                'notes' => $p->notes,
                'customerNotes' => $p->customer_notes,
                'sentAt' => $p->sent_at,
                'validUntil' => $p->valid_until,
                'createdAt' => $p->created_at,
                'updatedAt' => $p->updated_at,
                'items' => $p->items->map(fn($i) => ['id' => $i->id, 'description' => $i->description, 'quantity' => $i->quantity, 'unitPrice' => $i->unit_price, 'totalPrice' => $i->total_price, 'createdAt' => $i->created_at, 'updatedAt' => $i->updated_at]),
                'installments' => $p->installments->map(fn($i) => ['id' => $i->id, 'jobId' => $i->job_id, 'amount' => $i->amount, 'percentage' => $i->percentage, 'paymentDate' => $i->payment_date, 'description' => $i->description, 'isPaid' => $i->is_paid, 'paidAt' => $i->paid_at, 'createdAt' => $i->created_at, 'updatedAt' => $i->updated_at]),
                'revisionRequests' => $p->revisionRequests->map(fn($i) => ['id' => $i->id, 'notes' => $i->notes, 'status' => $i->status, 'createdAt' => $i->created_at, 'updatedAt' => $i->updated_at]),
            ]);

        $apiKeys = ApiKey::where('tenant_id', $tenantId)->get()->map(fn($k) => ['id' => $k->id, 'key' => $k->key, 'name' => $k->name, 'tenantId' => $k->tenant_id, 'createdAt' => $k->created_at, 'lastUsed' => $k->last_used]);

        $activityLogs = ActivityLog::where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
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
                'createdAt' => $l->created_at?->format('Y-m-d H:i:s')
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
            'createdAt' => $a->created_at?->format('Y-m-d H:i:s'),
            'updatedAt' => $a->updated_at?->format('Y-m-d H:i:s')
        ]);

        $appointmentTitles = AppointmentTitle::where('tenant_id', $tenantId)->get()->map(fn($at) => [
            'id' => $at->id,
            'tenantId' => $at->tenant_id,
            'name' => $at->name,
            'createdAt' => $at->created_at?->format('Y-m-d H:i:s'),
            'updatedAt' => $at->updated_at?->format('Y-m-d H:i:s')
        ]);

        $serviceTrackingCategories = ServiceTrackingCategory::where('tenant_id', $tenantId)->get()->map(fn($c) => [
            'id' => $c->id,
            'tenantId' => $c->tenant_id,
            'name' => $c->name,
            'createdAt' => $c->created_at?->format('Y-m-d H:i:s'),
            'updatedAt' => $c->updated_at?->format('Y-m-d H:i:s')
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
            'createdAt' => $t->created_at?->format('Y-m-d H:i:s'),
            'updatedAt' => $t->updated_at?->format('Y-m-d H:i:s')
        ]);

        $serviceTrackingLogs = ServiceTrackingLog::where('tenant_id', $tenantId)->get()->map(fn($l) => [
            'id' => $l->id,
            'tenantId' => $l->tenant_id,
            'serviceTrackingId' => $l->service_tracking_id,
            'plannedDate' => $l->planned_date,
            'completedAt' => $l->completed_at,
            'status' => $l->status,
            'notes' => $l->notes,
            'createdAt' => $l->created_at?->format('Y-m-d H:i:s'),
            'updatedAt' => $l->updated_at?->format('Y-m-d H:i:s')
        ]);


        $roles = Role::where('tenant_id', $tenantId)
            ->with('permissions')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'permissions' => $r->permissions->pluck('name')->toArray()
            ]);

        return [
            'version'   => '2.2',
            'timestamp' => now()->toISOString(),
            'tenantId'  => $tenantId,
            'data'      => [
                'services'       => $services,
                'jobstatuses'    => $jobStatuses,
                'steptemplates'  => $stepTemplates,
                'customers'         => $customers,
                'proposals'         => $proposals,
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
                'users'             => $includeUsers ? User::where('tenant_id', $tenantId)->get()->map(fn($u) => $u->makeVisible(['password'])->toArray()) : [],
            ],
            'tenant_settings' => [],
            'exported_from' => 'famedya_crm',
        ];
    }

    /**
     * Create a ZIP containing data.json and all tenant files
     */
    public function createBackupZip($tenantId, $password = null, $includeUsers = true, $progressCallback = null, $backupId = null)
    {
        // OPTIMIZED: 2GB memory limit for large file streaming (10-20 GB data handling)
        @ini_set('memory_limit', '2048M');
        @set_time_limit(0);

        $tenant = Tenant::findOrFail($tenantId);
        if ($progressCallback) $progressCallback(5, 'Veriler hazırlanıyor...');
        
        $data = $this->generateBackupData($tenantId, $includeUsers);
        
        $tempDir = null;
        $zipPath = null;
        try {
            $tempDir = storage_path('app/backup-temp/' . Str::random(10));
            // Normalize path separators for Windows compatibility
            $tempDir = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $tempDir);
            if (!file_exists($tempDir)) File::makeDirectory($tempDir, 0777, true);
            
            $jsonPath = $tempDir . DIRECTORY_SEPARATOR . 'data.json';
            file_put_contents($jsonPath, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            
            $zipName = Str::slug($tenant->name, '_') . '_full_backup_' . now()->format('Y-m-d_H-i') . '.zip';
            $zipPath = storage_path('app/backup-temp/' . $zipName);
            // Normalize ZIP path too
            $zipPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $zipPath);
            $tempFilesToCleanup = [];
            
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            if ($password) {
                $zip->setPassword($password);
            }

            if ($progressCallback) $progressCallback(10, 'JSON veritabanı pakete ekleniyor...');

            // Add data.json
            $zip->addFile($jsonPath, 'data.json');
            $zip->setCompressionName('data.json', \ZipArchive::CM_STORE);
            if ($password) {
                $zip->setEncryptionName('data.json', \ZipArchive::EM_AES_256);
            }
            
            // Configure S3 for this tenant
            if ($this->setGlobalS3Config($tenantId)) {
                if ($progressCallback) $progressCallback(15, 'S3 üzerinden dosya listesi alınıyor...');
                
                $s3 = Storage::disk('s3_global');
                $files = $s3->allFiles("tenants/{$tenantId}");
                
                $totalFiles = count($files);
                $processedFiles = 0;

                if ($totalFiles > 0) {
                    // OPTIMIZED: Batch size = 1 (serial processing for large files)
                    // Prevents memory exhaustion and ensures complete downloads
                    $chunks = array_chunk($files, 1);
                    foreach ($chunks as $batch) {
                        if ($backupId && Cache::has("backup_cancelled_{$backupId}")) {
                            throw new \Exception("Yedekleme kullanıcı tarafından iptal edildi.");
                        }
                        $batchItems = [];
                        foreach ($batch as $f) {
                            $relP = str_replace("tenants/{$tenantId}/", "", $f);
                            // S3'ten dosya boyutunu al
                            $s3Size = $s3->size($f);
                            $batchItems[] = [
                                'relative' => $relP,
                                'original' => $f,
                                's3_size'  => $s3Size,
                            ];
                        }

                        if ($progressCallback) {
                            $p = 15 + round(($processedFiles / max(1, $totalFiles)) * 80);
                            $progressCallback($p, "Dosyalar indiriliyor: ".($processedFiles + 1)."/$totalFiles");
                        }

                        // OPTIMIZED: S3 Stream → Temp → ZIP (memory-safe streaming with temp file)
                        // Using stream_copy_to_stream() for memory efficiency
                        foreach ($batchItems as $item) {
                            $tempFile = $tempDir . DIRECTORY_SEPARATOR . Str::random(16);
                            try {
                                // Verify temp directory exists and is writable
                                if (!is_dir($tempDir)) {
                                    $processedFiles++;
                                    continue;
                                }
                                if (!is_writable($tempDir)) {
                                    $processedFiles++;
                                    continue;
                                }
                                
                                // Calculate adaptive timeout: 1 MB = 1 second, max 2 hours
                                $sizeMb = ($item['s3_size'] ?? 0) / (1024 * 1024);
                                $timeout = max(120, min(7200, (int)ceil($sizeMb)));
                                
                                
                                $readStream = null;
                                $writeStream = null;
                                
                                try {
                                    // Open S3 stream for reading
                                    $readStream = $s3->readStream($item['original']);
                                    if (!is_resource($readStream)) {
                                        $processedFiles++;
                                        continue;
                                    }

                                    // Open temp file for writing
                                    $writeStream = fopen($tempFile, 'wb');
                                    if (!is_resource($writeStream)) {
                                        fclose($readStream);
                                        $processedFiles++;
                                        continue;
                                    }

                                    // Stream copy: memory-safe chunked download
                                    $copied = stream_copy_to_stream($readStream, $writeStream);
                                    if ($copied === false) {
                                        @unlink($tempFile);
                                    } else {
                                        // Verify file size matches S3
                                        $localSize = filesize($tempFile);
                                        if ($localSize !== $item['s3_size']) {
                                            @unlink($tempFile);
                                        } else {
                                            // Add temp file to ZIP
                                            $zip->addFile($tempFile, 'files/' . $item['relative']);
                                            $zip->setCompressionName('files/' . $item['relative'], \ZipArchive::CM_STORE);
                                            if ($password) {
                                                $zip->setEncryptionName('files/' . $item['relative'], \ZipArchive::EM_AES_256);
                                            }
                                        }
                                    }
                                } catch (\Exception $e) {
                                    \Illuminate\Support\Facades\Log::error("Backup: Dosya indirme hatası [{$item['original']}]: " . $e->getMessage());
                                    @unlink($tempFile);
                                } finally {
                                    if (is_resource($readStream)) { try { fclose($readStream); } catch (\Throwable $t) {} }
                                    if (is_resource($writeStream)) { try { fclose($writeStream); } catch (\Throwable $t) {} }
                                }
                                
                            } catch (\Exception $e) {
                                \Illuminate\Support\Facades\Log::error("Backup: Dosya işleme hatası [{$item['original']}]: " . $e->getMessage());
                                @unlink($tempFile);
                            }
                            
                            $processedFiles++;
                            
                            if ($progressCallback) {
                                $p = 15 + round(($processedFiles / max(1, $totalFiles)) * 80);
                                $progressCallback($p, "Dosyalar işleniyor: $processedFiles/$totalFiles");
                            }
                        }
                    }
                }
            }
            
            if ($progressCallback) $progressCallback(95, 'Paket kapatılıyor...');
            $zip->close();
        }
        } catch (\Exception $e) {
            if ($zipPath && File::exists($zipPath)) {
                File::delete($zipPath);
            }
            throw $e;
        } finally {
            if ($tempDir && File::exists($tempDir)) {
                File::deleteDirectory($tempDir);
            }

            // Temizlik: backup-temp klasörü boşsa sil
            $baseTemp = storage_path('app/backup-temp');
            if (File::isDirectory($baseTemp)) {
                $files = File::files($baseTemp);
                $dirs = File::directories($baseTemp);
                if (count($files) === 0 && count($dirs) === 0) {
                    File::deleteDirectory($baseTemp);
                }
            }
        }
        
        if ($progressCallback) $progressCallback(100, 'Tamamlandı!');
        
        return $zipPath;
    }

    /**
     * Import a full ZIP backup into a target tenant
     * 
     * @param $zipPath Path to ZIP file
     * @param $targetTenantId Target tenant ID
     * @param $password Optional ZIP password
     * @param $invokerUserId Optional user ID who initiated import
     * @param $progressCallback Optional progress callback
     * @param $manageRestoringFlag Whether to manage is_restoring flag (set true/false). 
     *                             Set to false if caller manages the flag separately.
     */
    public function importBackupZip($zipPath, $targetTenantId, $password = null, $invokerUserId = null, $progressCallback = null, $manageRestoringFlag = true)
    {
        $tenant = Tenant::findOrFail($targetTenantId);
        
        // Only set restoring state if caller doesn't manage it separately
        if ($manageRestoringFlag) {
            $tenant->update(['is_restoring' => true]);
        }

        try {
            $zip = new \ZipArchive();
            
            if ($zip->open($zipPath) !== TRUE) {
                throw new \Exception("Yedek dosyası açılamadı.");
            }

            if ($password) {
                $zip->setPassword($password);
            }
            
            // 1. Extract and read data.json
            $jsonContent = $zip->getFromName('data.json');
            
            // Check if encryption is needed but missing/wrong password
            if ($jsonContent === false) {
                 $stat = $zip->statName('data.json');
                 if ($stat && $stat['encryption_method'] > 0) {
                     $zip->close();
                     throw new \Exception("Yedek dosyası şifreli. Lütfen geçerli bir şifre girin.", 403);
                 }
                 $zip->close();
                 throw new \Exception("data.json dosyası okunamadı veya şifre hatalı.");
            }

            $backup = json_decode($jsonContent, true);
            if (!$backup || !isset($backup['data'])) {
                $zip->close();
                throw new \Exception("Geçersiz veri formatı.");
            }
            
            $data = $backup['data'];
            
            if ($progressCallback) $progressCallback(5, 'Veritabanı temizleniyor...');

            // 2. Clear old data before import
            $deleteUsers = isset($data['users']);
            $this->resetTenantData($targetTenantId, $invokerUserId, $deleteUsers);

            // DB progress tracking
            $totalDbItems = 0;
            foreach ($data as $items) if (is_array($items)) $totalDbItems += count($items);
            $processedDbItems = 0;

            $tick = function($msg) use ($progressCallback, $totalDbItems, &$processedDbItems) {
                $processedDbItems++;
                if ($progressCallback && ($processedDbItems % 10 == 0 || $processedDbItems == $totalDbItems)) {
                    $percent = 10 + round(($processedDbItems / max(1, $totalDbItems)) * 20); // %10 -> %30 arası
                    $progressCallback($percent, $msg);
                }
            };

            // ID Mapping maps
            $serviceMap = [];
            $cfMap = [];
            $statusMap = [];
            $customerMap = [];
            $proposalMap = [];
            $jobMap = [];
            $expenseCatMap = [];
            $cashMap = [];
            $stCatMap = [];
            $stMap = [];
            $userMap = [];

            // Model::unguard() removed for security. Using explicit creation logic
            \Illuminate\Support\Facades\DB::transaction(function () use ($data, $targetTenantId, &$serviceMap, &$cfMap, &$statusMap, &$customerMap, &$proposalMap, &$jobMap, &$userMap, &$expenseCatMap, &$cashMap, &$stCatMap, &$stMap, $tick) {
                // Services & Custom Fields
                foreach (($data['services'] ?? []) as $s) {
                    $service = \App\Models\Service::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'name' => $s['name'],
                        'config' => $s['config'] ?? '{}',
                    ]);
                    $serviceMap[$s['id']] = $service->id;
                    
                    foreach (($s['customfield'] ?? []) as $cf) {
                        $newCf = $service->customFields()->forceCreate([
                            'label' => $cf['label'],
                            'type' => $cf['type'],
                            'required' => $cf['required'] ?? false,
                            'order' => $cf['order'] ?? 0,
                        ]);
                        $cfMap[$cf['id']] = $newCf->id;
                    }
                    $tick("Servisler içe aktarılıyor...");
                }

                // Users (Personnel)
                foreach (($data['users'] ?? []) as $u) {
                    $newUser = \App\Models\User::firstOrCreate(
                        ['tenant_id' => $targetTenantId, 'email' => $u['email']],
                        [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'name' => $u['name'],
                            'password' => $u['password'],
                            'role' => $u['role'] ?? 'USER',
                        ]
                    );
                    $userMap[$u['id']] = $newUser->id;
                    $tick("Personeller...");
                }

                // Roles
                foreach (($data['roles'] ?? []) as $r) {
                    $role = \App\Models\Role::firstOrCreate(['tenant_id' => $targetTenantId, 'name' => $r['name']], ['guard_name' => 'web']);
                    if (!empty($r['permissions'])) {
                        $role->syncPermissions($r['permissions']);
                    }
                    $tick("Yetkiler işleniyor...");
                }

                // Job Statuses
                foreach (($data['jobstatuses'] ?? []) as $s) {
                    $status = \App\Models\JobStatus::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'name' => $s['name'],
                        'color' => $s['color'],
                        'order' => $s['order'] ?? 0,
                    ]);
                    $statusMap[$s['id']] = $status->id;
                    $tick("İş durumları işleniyor...");
                }

                // Step Templates
                foreach (($data['steptemplates'] ?? []) as $t) {
                    $template = \App\Models\StepTemplate::forceCreate(['tenant_id' => $targetTenantId, 'name' => $t['name']]);
                    foreach (($t['defaultstep'] ?? []) as $ds) {
                        $template->defaultSteps()->forceCreate(['tenant_id' => $targetTenantId, 'title' => $ds['title'], 'order' => $ds['order'] ?? 0]);
                    }
                    $tick("Adım şablonları işleniyor...");
                }

                // Customers
                foreach (($data['customers'] ?? []) as $c) {
                    $customer = \App\Models\Customer::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'name' => $c['name'],
                        'phone' => $c['phone'],
                        'email' => $c['email'],
                        'notes' => $c['notes'],
                    ]);
                    $customerMap[$c['id']] = $customer->id;
                    $tick("Müşteriler işleniyor...");
                }

                // Proposals
                foreach (($data['proposals'] ?? []) as $p) {
                    $prop = \App\Models\Proposal::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'customer_id' => $customerMap[$p['customerId']] ?? null,
                        'service_id' => $serviceMap[$p['serviceId']] ?? null,
                        'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                        'title' => $p['title'],
                        'description' => $p['description'] ?? null,
                        'total_price' => $p['totalPrice'] ?? 0,
                        'subtotal' => $p['subtotal'] ?? 0,
                        'vat_amount' => $p['vatAmount'] ?? 0,
                        'is_vat_included' => $p['isVatIncluded'] ?? false,
                        'vat_rate' => $p['vatRate'] ?? 20,
                        'status' => $p['status'] ?? 'DRAFT',
                        'notes' => $p['notes'],
                        'customer_notes' => $p['customerNotes'],
                        'sent_at' => $p['sentAt'],
                        'valid_until' => $p['validUntil'],
                    ]);
                    $proposalMap[$p['id']] = $prop->id;
                    
                    foreach (($p['items'] ?? []) as $item) {
                        $prop->items()->forceCreate(['description' => $item['description'], 'quantity' => $item['quantity'], 'unit_price' => $item['unitPrice'], 'total_price' => $item['totalPrice']]);
                    }
                    foreach (($p['installments'] ?? []) as $inst) {
                        $prop->installments()->forceCreate(['amount' => $inst['amount'], 'percentage' => $inst['percentage'], 'payment_date' => $inst['paymentDate'], 'description' => $inst['description'], 'is_paid' => $inst['isPaid'], 'paid_at' => $inst['paidAt']]);
                    }
                    foreach (($p['revisionRequests'] ?? []) as $rev) {
                        $prop->revisionRequests()->forceCreate(['notes' => $rev['notes'], 'status' => $rev['status']]);
                    }
                    $tick("Teklifler işleniyor...");
                }

                // Cash Registers
                foreach (($data['cash_registers'] ?? []) as $cr) {
                    $reg = \App\Models\CashRegister::forceCreate(['tenant_id' => $targetTenantId, 'name' => $cr['name'], 'is_default' => $cr['is_default']]);
                    $cashMap[$cr['id']] = $reg->id;
                    $tick("Kasalar işleniyor...");
                }

                // Expense Categories
                foreach (($data['expensecategories'] ?? []) as $ec) {
                    $cat = \App\Models\ExpenseCategory::forceCreate(['tenant_id' => $targetTenantId, 'name' => $ec['name']]);
                    $expenseCatMap[$ec['id']] = $cat->id;
                    $tick("Gider kategorileri işleniyor...");
                }

                // Jobs
                foreach (($data['jobs'] ?? []) as $j) {
                    $job = \App\Models\JobCrm::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'customer_id' => $customerMap[$j['customerId']] ?? null,
                        'service_id' => $serviceMap[$j['serviceId']] ?? null,
                        'job_status_id' => $statusMap[$j['jobStatusId']] ?? null,
                        'title' => $j['title'],
                        'description' => $j['description'],
                        'status' => $j['status'] ?? 'PENDING',
                        'start_date' => $j['startDate'],
                        'end_date' => $j['endDate'],
                        'total_price' => $j['totalPrice'] ?? 0,
                        'subtotal' => $j['subtotal'] ?? 0,
                        'is_vat_included' => $j['vat'] ?? false,
                        'vat_amount' => $j['vatAmount'] ?? 0,
                        'vat_rate' => $j['vatRate'] ?? 0,
                        'proposal_id' => $proposalMap[$j['proposalId'] ?? ''] ?? null,
                        'user_id' => $userMap[$j['userId'] ?? ''] ?? null,
                        'order' => $j['order'] ?? 0,
                    ]);
                    $jobMap[$j['id']] = $job->id;
                    
                    if ($j['jobdetail']) {
                        $job->jobDetail()->forceCreate(['customer_requests' => $j['jobdetail']['customer_requests'], 'notes' => $j['jobdetail']['notes']]);
                    }
                    foreach (($j['jobstep'] ?? []) as $step) {
                        $job->jobSteps()->forceCreate(['title' => $step['title'], 'is_completed' => $step['isCompleted'], 'order' => $step['order']]);
                    }
                    foreach (($j['customfieldvalue'] ?? []) as $val) {
                        $job->customFieldValues()->forceCreate(['custom_field_id' => $cfMap[$val['customFieldId']] ?? null, 'value' => $val['value']]);
                    }
                    foreach (($j['payment'] ?? []) as $p) {
                        $job->payments()->forceCreate([
                            'tenant_id' => $targetTenantId,
                            'cash_register_id' => $cashMap[$p['cashRegisterId']] ?? null,
                            'amount' => $p['amount'],
                            'payment_date' => $p['paymentDate'],
                            'payment_type' => $p['paymentType'],
                            'description' => $p['description'],
                            'receipt_path' => $p['receiptPath']
                        ]);
                    }
                    foreach (($j['jobfile'] ?? []) as $f) {
                        $job->jobFiles()->forceCreate([
                            'file_name' => $f['fileName'],
                            'file_path' => $f['filePath'], 
                            'file_type' => $f['fileType'],
                            'file_size' => $f['fileSize'],
                        ]);
                    }
                    $tick("İşler ve kayıtlar işleniyor...");
                }

                // Expenses
                foreach (($data['expenses'] ?? []) as $e) {
                    \App\Models\Expense::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'job_id' => $jobMap[$e['jobId']] ?? null,
                        'category_id' => $expenseCatMap[$e['categoryId']] ?? null,
                        'cash_register_id' => $cashMap[$e['cashRegisterId']] ?? null,
                        'title' => $e['title'],
                        'amount' => $e['amount'],
                        'date' => $e['date'],
                        'description' => $e['description'],
                        'receipt_path' => $e['receiptPath'],
                    ]);
                    $tick("Giderler işleniyor...");
                }

                // Appointments & Titles
                foreach (($data['appointment_titles'] ?? []) as $at) {
                    \App\Models\AppointmentTitle::forceCreate(['tenant_id' => $targetTenantId, 'name' => $at['name']]);
                    $tick("Randevu başlıkları...");
                }
                foreach (($data['appointments'] ?? []) as $a) {
                    \App\Models\Appointment::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'customer_id' => $customerMap[$a['customerId']] ?? null,
                        'title' => $a['title'],
                        'description' => $a['description'],
                        'start_time' => $a['startTime'],
                        'end_time' => $a['endTime'],
                        'status' => $a['status'],
                    ]);
                    $tick("Randevular...");
                }

                // Service Tracking
                foreach (($data['service_tracking_categories'] ?? []) as $stc) {
                    $cat = \App\Models\ServiceTrackingCategory::forceCreate(['tenant_id' => $targetTenantId, 'name' => $stc['name']]);
                    $stCatMap[$stc['id']] = $cat->id;
                    $tick("Takip kategorileri...");
                }
                foreach (($data['service_trackings'] ?? []) as $st) {
                    $track = \App\Models\ServiceTracking::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'category_id' => $stCatMap[$st['categoryId']] ?? null,
                        'customer_id' => $customerMap[$st['customerId']] ?? null,
                        'job_id' => $jobMap[$st['jobId']] ?? null,
                        'title' => $st['title'],
                        'description' => $st['description'],
                        'period' => $st['period'],
                        'period_unit' => $st['periodUnit'],
                        'start_date' => $st['startDate'],
                        'next_date' => $st['nextDate'],
                        'status' => $st['status'],
                    ]);
                    $stMap[$st['id']] = $track->id;
                    $tick("Servis takipleri...");
                }
                foreach (($data['service_tracking_logs'] ?? []) as $sl) {
                    \App\Models\ServiceTrackingLog::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'service_tracking_id' => $stMap[$sl['serviceTrackingId']] ?? null,
                        'planned_date' => $sl['plannedDate'],
                        'completed_at' => $sl['completedAt'],
                        'status' => $sl['status'],
                        'notes' => $sl['notes']
                    ]);
                    $tick("Takip kayıtları...");
                }

                // Activity Logs
                foreach (($data['activitylogs'] ?? []) as $log) {
                    \App\Models\ActivityLog::forceCreate([
                        'tenant_id' => $targetTenantId,
                        'user_id' => $userMap[$log['userId'] ?? ''] ?? null,
                        'action' => $log['action'] ?? 'UPDATE',
                        'entity_type' => $log['entityType'] ?? 'SYSTEM',
                        'entity_id' => $log['entityId'] ?? null,
                        'entity_name' => $log['entityName'] ?? null,
                        'details' => $log['details'] ?? null,
                        'created_at' => $log['createdAt'] ?? now(),
                    ]);
                }
            });

            if ($progressCallback) {
                $progressCallback(30, "Veritabanı verileri içe aktarıldı.");
            }

            // 4. Handle Files
            $totalSize = 0;
            if ($this->setGlobalS3Config($targetTenantId)) {
                $s3 = \Illuminate\Support\Facades\Storage::disk('s3_global');
                
                $fileIndices = [];
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $filename = $zip->getNameIndex($i);
                    if (str_starts_with($filename, 'files/')) {
                        $fileIndices[] = $i;
                    }
                }

                $totalFiles = count($fileIndices);
                $processedFiles = 0;

                foreach ($fileIndices as $index) {
                    $filename = $zip->getNameIndex($index);
                    $fileStat = $zip->statIndex($index);
                    $totalSize += $fileStat['size'] ?? 0;
                    
                    $stream = $zip->getStream($filename);
                    if ($stream) {
                        $s3Path = "tenants/{$targetTenantId}/" . str_replace('files/', '', $filename);
                        $s3->writeStream($s3Path, $stream);
                    }
                    
                    $processedFiles++;
                    if ($progressCallback) {
                        // DB is first 30%, files are the remaining 70%
                        $progress = 30 + round(($processedFiles / max(1, $totalFiles)) * 70);
                        if ($progress > 99) $progress = 99; // 100 is reserved for absolute finish
                        $progressCallback($progress, "Dosyalar S3'e yükleniyor: {$processedFiles}/{$totalFiles}");
                    }
                }

                // Update URLs in DB for this tenant
                $allJobFiles = \App\Models\JobFile::whereHas('job', fn($q) => $q->where('tenant_id', $targetTenantId))->get();
                foreach ($allJobFiles as $jf) {
                    if (filter_var($jf->file_path, FILTER_VALIDATE_URL)) {
                         $oldInfo = parse_url($jf->file_path);
                         $pathPart = ltrim($oldInfo['path'] ?? '', '/');
                         if (preg_match('/tenants\/[^\/]+\/(.+)/', urldecode($pathPart), $matches)) {
                             $relPath = $matches[1];
                             $newS3Path = "tenants/{$targetTenantId}/{$relPath}";
                             if ($s3->exists($newS3Path)) {
                                 $jf->update(['file_path' => $s3->url($newS3Path)]);
                             }
                         }
                    }
                }
            }
            
            $tenant->update(['storage_used' => $totalSize]);
            
            $zip->close();
            
            if ($manageRestoringFlag) {
                $tenant->update(['is_restoring' => false]);
            }
            if ($progressCallback) $progressCallback(100, "Tamamlandı");
            return true;
        } catch (\Exception $e) {
            if ($manageRestoringFlag) {
                $tenant->update(['is_restoring' => false]);
            }
            throw $e;
        }
    }

    /**
     * Clear all data for a specific tenant
     */
    public function resetTenantData($tenantId, $keepUserId = null, $deleteUsers = false)
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($tenantId, $keepUserId, $deleteUsers) {
            $jobIds = \App\Models\JobCrm::where('tenant_id', $tenantId)->pluck('id');
            \App\Models\JobDetail::whereIn('job_id', $jobIds)->delete();
            \App\Models\JobFile::whereIn('job_id', $jobIds)->delete();
            \App\Models\JobStep::whereIn('job_id', $jobIds)->delete();
            \App\Models\CustomFieldValue::whereIn('job_id', $jobIds)->delete();
            \App\Models\Payment::whereIn('job_id', $jobIds)->delete();
            \App\Models\Expense::whereIn('job_id', $jobIds)->delete();
            \App\Models\JobCrm::where('tenant_id', $tenantId)->delete();

            \App\Models\Customer::where('tenant_id', $tenantId)->delete();
            $proposalIds = \App\Models\Proposal::where('tenant_id', $tenantId)->pluck('id');
            \App\Models\ProposalItem::whereIn('proposal_id', $proposalIds)->delete();
            \App\Models\ProposalInstallment::whereIn('proposal_id', $proposalIds)->delete();
            \App\Models\ProposalRevisionRequest::whereIn('proposal_id', $proposalIds)->delete();
            \App\Models\Proposal::where('tenant_id', $tenantId)->delete();

            \App\Models\Payment::where('tenant_id', $tenantId)->delete();
            \App\Models\Expense::where('tenant_id', $tenantId)->delete();
            \App\Models\CashRegister::where('tenant_id', $tenantId)->delete();
            \App\Models\ExpenseCategory::where('tenant_id', $tenantId)->delete();
            
            $serviceIds = \App\Models\Service::where('tenant_id', $tenantId)->pluck('id');
            \App\Models\CustomField::whereIn('service_id', $serviceIds)->delete();
            \App\Models\Service::where('tenant_id', $tenantId)->delete();

            \App\Models\JobStatus::where('tenant_id', $tenantId)->delete();
            $templateIds = \App\Models\StepTemplate::where('tenant_id', $tenantId)->pluck('id');
            \App\Models\DefaultStep::whereIn('template_id', $templateIds)->delete();
            \App\Models\StepTemplate::where('tenant_id', $tenantId)->delete();

            \App\Models\ActivityLog::where('tenant_id', $tenantId)->delete();

            // Clear cache versions for this tenant
            foreach (['customers', 'jobs', 'payments', 'expenses', 'appointments', 'proposals'] as $mod) {
                \Illuminate\Support\Facades\Cache::forget("tenant_{$tenantId}_{$mod}_version");
            }
            \App\Models\ApiKey::where('tenant_id', $tenantId)->delete();
            \App\Models\Appointment::where('tenant_id', $tenantId)->delete();
            \App\Models\AppointmentTitle::where('tenant_id', $tenantId)->delete();
            \App\Models\ServiceTrackingLog::where('tenant_id', $tenantId)->delete();
            \App\Models\ServiceTracking::where('tenant_id', $tenantId)->delete();
            \App\Models\ServiceTrackingCategory::where('tenant_id', $tenantId)->delete();

            \App\Models\Role::where('tenant_id', $tenantId)->delete();
            
            if ($deleteUsers) {
                $query = \App\Models\User::where('tenant_id', $tenantId);
                if ($keepUserId) {
                    $query->where('id', '!=', $keepUserId);
                }
                $query->delete();
            }
        });
    }

    /**
     * Helper to create an initial admin user for the tenant.
     * Bypasses mass-assignment for tenant_id.
     */
    public function createAdminForTenant($tenantId, $name, $email, $password)
    {
        $user = new \App\Models\User([
            'id'          => \Illuminate\Support\Str::uuid()->toString(),
            'name'        => $name,
            'email'       => $email,
            'password'    => \Illuminate\Support\Facades\Hash::make($password),
            'role'        => 'ADMIN',
            'is_approved' => true,
        ]);
        $user->tenant_id = $tenantId;
        $user->save();
        return $user;
    }

}
