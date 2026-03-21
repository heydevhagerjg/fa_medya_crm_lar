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
use App\Models\ServiceTrackingCategory;
use App\Models\ServiceTracking;
use App\Models\ServiceTrackingLog;
use App\Models\User;
use Illuminate\Support\Str;

class TenantBackupService
{
    use \App\Traits\S3GlobalConfigTrait;

    public function generateBackupData($tenantId)
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
                'proposalId'       => $j->proposal_id,
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
            ],
            'tenant_settings' => [],
            'exported_from' => 'famedya_crm',
        ];
    }

    /**
     * Create a ZIP containing data.json and all tenant files
     */
    public function createBackupZip($tenantId, $password = null)
    {
        $tenant = Tenant::findOrFail($tenantId);
        $data = $this->generateBackupData($tenantId);
        
        $tempDir = storage_path('app/backup-temp/' . Str::random(10));
        if (!file_exists($tempDir)) mkdir($tempDir, 0777, true);
        
        $jsonPath = $tempDir . '/data.json';
        file_put_contents($jsonPath, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        
        $zipName = \Illuminate\Support\Str::slug($tenant->name, '_') . '_full_backup_' . now()->format('Y-m-d_H-i') . '.zip';
        $zipPath = storage_path('app/backup-temp/' . $zipName);
        
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            if ($password) {
                $zip->setPassword($password);
            }

            // Add data.json
            $zip->addFile($jsonPath, 'data.json');
            if ($password) {
                $zip->setEncryptionName('data.json', \ZipArchive::EM_AES_256);
            }
            
            // Configure S3 for this tenant
            if ($this->setGlobalS3Config($tenantId)) {
                // Add files from S3
                $s3 = \Illuminate\Support\Facades\Storage::disk('s3_global');
                $files = $s3->allFiles("tenants/{$tenantId}");
                
                foreach ($files as $file) {
                    $content = $s3->get($file);
                    // Strip the 'tenants/{id}/' part from the path inside zip
                    $relativePath = str_replace("tenants/{$tenantId}/", "", $file);
                    $zip->addFromString('files/' . $relativePath, $content);
                    
                    if ($password) {
                        $zip->setEncryptionName('files/' . $relativePath, \ZipArchive::EM_AES_256);
                    }
                }
            }
            
            $zip->close();
        }
        
        // Cleanup temp folder
        @unlink($jsonPath);
        @rmdir($tempDir);
        
        return $zipPath;
    }

    /**
     * Import a full ZIP backup into a target tenant
     */
    public function importBackupZip($zipPath, $targetTenantId, $password = null, $invokerUserId = null)
    {
        // 0. Set restoring state
        $tenant = Tenant::findOrFail($targetTenantId);
        $tenant->update(['is_restoring' => true]);

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
            
            // 2. Clear old data before import
            $deleteUsers = isset($data['users']);
            $this->resetTenantData($targetTenantId, $invokerUserId, $deleteUsers);

            // 3. ID Mapping maps
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

            \Illuminate\Database\Eloquent\Model::unguard();
            
            \Illuminate\Support\Facades\DB::transaction(function () use ($data, $targetTenantId, &$serviceMap, &$cfMap, &$statusMap, &$customerMap, &$proposalMap, &$jobMap, &$expenseCatMap, &$cashMap, &$stCatMap, &$stMap) {
                // ... same import logic as before ...
                
                // Services & Custom Fields
                foreach (($data['services'] ?? []) as $s) {
                    $service = \App\Models\Service::create([
                        'tenant_id' => $targetTenantId,
                        'name' => $s['name'],
                        'config' => $s['config'] ?? '{}',
                    ]);
                    $serviceMap[$s['id']] = $service->id;
                    
                    foreach (($s['customfield'] ?? []) as $cf) {
                        $newCf = $service->customFields()->create([
                            'label' => $cf['label'],
                            'type' => $cf['type'],
                            'required' => $cf['required'] ?? false,
                            'order' => $cf['order'] ?? 0,
                        ]);
                        $cfMap[$cf['id']] = $newCf->id;
                    }
                }

                // Roles
                foreach (($data['roles'] ?? []) as $r) {
                    $role = \App\Models\Role::firstOrCreate(['tenant_id' => $targetTenantId, 'name' => $r['name']], ['guard_name' => 'web']);
                    if (!empty($r['permissions'])) {
                        $role->syncPermissions($r['permissions']);
                    }
                }

                // Job Statuses
                foreach (($data['jobstatuses'] ?? []) as $s) {
                    $status = \App\Models\JobStatus::create([
                        'tenant_id' => $targetTenantId,
                        'name' => $s['name'],
                        'color' => $s['color'],
                        'order' => $s['order'] ?? 0,
                    ]);
                    $statusMap[$s['id']] = $status->id;
                }

                // Step Templates
                foreach (($data['steptemplates'] ?? []) as $t) {
                    $template = \App\Models\StepTemplate::create(['tenant_id' => $targetTenantId, 'name' => $t['name']]);
                    foreach (($t['defaultstep'] ?? []) as $ds) {
                        $template->defaultSteps()->create(['tenant_id' => $targetTenantId, 'title' => $ds['title'], 'order' => $ds['order'] ?? 0]);
                    }
                }

                // Customers
                foreach (($data['customers'] ?? []) as $c) {
                    $customer = \App\Models\Customer::create([
                        'tenant_id' => $targetTenantId,
                        'name' => $c['name'],
                        'phone' => $c['phone'],
                        'email' => $c['email'],
                        'notes' => $c['notes'],
                    ]);
                    $customerMap[$c['id']] = $customer->id;
                }

                // Proposals
                foreach (($data['proposals'] ?? []) as $p) {
                    $prop = \App\Models\Proposal::create([
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
                        $prop->items()->create(['description' => $item['description'], 'quantity' => $item['quantity'], 'unit_price' => $item['unitPrice'], 'total_price' => $item['totalPrice']]);
                    }
                    foreach (($p['installments'] ?? []) as $inst) {
                        $prop->installments()->create(['amount' => $inst['amount'], 'percentage' => $inst['percentage'], 'payment_date' => $inst['paymentDate'], 'description' => $inst['description'], 'is_paid' => $inst['isPaid'], 'paid_at' => $inst['paidAt']]);
                    }
                    foreach (($p['revisionRequests'] ?? []) as $rev) {
                        $prop->revisionRequests()->create(['notes' => $rev['notes'], 'status' => $rev['status']]);
                    }
                }

                // Cash Registers
                foreach (($data['cash_registers'] ?? []) as $cr) {
                    $reg = \App\Models\CashRegister::create(['tenant_id' => $targetTenantId, 'name' => $cr['name'], 'is_default' => $cr['is_default']]);
                    $cashMap[$cr['id']] = $reg->id;
                }

                // Expense Categories
                foreach (($data['expensecategories'] ?? []) as $ec) {
                    $cat = \App\Models\ExpenseCategory::create(['tenant_id' => $targetTenantId, 'name' => $ec['name']]);
                    $expenseCatMap[$ec['id']] = $cat->id;
                }

                // Jobs
                foreach (($data['jobs'] ?? []) as $j) {
                    $job = \App\Models\JobCrm::create([
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
                        'proposal_id' => $proposalMap[$j['proposalId']] ?? null,
                        'order' => $j['order'] ?? 0,
                    ]);
                    $jobMap[$j['id']] = $job->id;
                    
                    if ($j['jobdetail']) {
                        $job->jobDetail()->create(['customer_requests' => $j['jobdetail']['customer_requests'], 'notes' => $j['jobdetail']['notes']]);
                    }
                    foreach (($j['jobstep'] ?? []) as $step) {
                        $job->jobSteps()->create(['title' => $step['title'], 'is_completed' => $step['isCompleted'], 'order' => $step['order']]);
                    }
                    foreach (($j['customfieldvalue'] ?? []) as $val) {
                        $job->customFieldValues()->create(['custom_field_id' => $cfMap[$val['customFieldId']] ?? null, 'value' => $val['value']]);
                    }
                    foreach (($j['payment'] ?? []) as $p) {
                        $job->payments()->create([
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
                        $job->jobFiles()->create([
                            'file_name' => $f['fileName'],
                            'file_path' => $f['filePath'], 
                            'file_type' => $f['fileType'],
                            'file_size' => $f['fileSize'],
                        ]);
                    }
                }

                // Expenses
                foreach (($data['expenses'] ?? []) as $e) {
                    \App\Models\Expense::create([
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
                }

                // Appointments & Titles
                foreach (($data['appointment_titles'] ?? []) as $at) {
                    \App\Models\AppointmentTitle::create(['tenant_id' => $targetTenantId, 'name' => $at['name']]);
                }
                foreach (($data['appointments'] ?? []) as $a) {
                    \App\Models\Appointment::create([
                        'tenant_id' => $targetTenantId,
                        'customer_id' => $customerMap[$a['customerId']] ?? null,
                        'title' => $a['title'],
                        'description' => $a['description'],
                        'start_time' => $a['startTime'],
                        'end_time' => $a['endTime'],
                        'status' => $a['status'],
                    ]);
                }

                // Service Tracking
                foreach (($data['service_tracking_categories'] ?? []) as $stc) {
                    $cat = \App\Models\ServiceTrackingCategory::create(['tenant_id' => $targetTenantId, 'name' => $stc['name']]);
                    $stCatMap[$stc['id']] = $cat->id;
                }
                foreach (($data['service_trackings'] ?? []) as $st) {
                    $track = \App\Models\ServiceTracking::create([
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
                }
                foreach (($data['service_tracking_logs'] ?? []) as $sl) {
                    \App\Models\ServiceTrackingLog::create([
                        'tenant_id' => $targetTenantId,
                        'service_tracking_id' => $stMap[$sl['serviceTrackingId']] ?? null,
                        'planned_date' => $sl['plannedDate'],
                        'completed_at' => $sl['completedAt'],
                        'status' => $sl['status'],
                        'notes' => $sl['notes']
                    ]);
                }
            });

            // 4. Handle Files
            $totalSize = 0;
            if ($this->setGlobalS3Config($targetTenantId)) {
                $s3 = \Illuminate\Support\Facades\Storage::disk('s3_global');
                
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $filename = $zip->getNameIndex($i);
                    if (str_starts_with($filename, 'files/')) {
                        $content = $zip->getFromIndex($i);
                        $totalSize += strlen($content);
                        $s3Path = "tenants/{$targetTenantId}/" . str_replace('files/', '', $filename);
                        $s3->put($s3Path, $content);
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
            \Illuminate\Database\Eloquent\Model::reguard();
            
            $tenant->update(['is_restoring' => false]);
            return true;
        } catch (\Exception $e) {
            $tenant->update(['is_restoring' => false]);
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
     * Helper to format dates for MySQL
     */
    private function formatDate($date)
    {
        if (!$date) return null;
        try {
            return \Illuminate\Support\Carbon::parse($date)->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return $date;
        }
    }
}
