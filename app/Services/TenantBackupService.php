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
    public function createBackupZip($tenantId)
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
            // Add data.json
            $zip->addFile($jsonPath, 'data.json');
            
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
                }
            }
            
            $zip->close();
        }
        
        // Cleanup temp folder
        @unlink($jsonPath);
        @rmdir($tempDir);
        
        return $zipPath;
    }
}
