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
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BackupController extends Controller
{
    /**
     * Export all tenant data as JSON (the same format as Next.js backup)
     */
    public function export(Request $request): JsonResponse
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
                'jobdetail'        => $j->jobDetail,
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
            ->limit(200)
            ->get()
            ->map(fn($l) => ['id' => $l->id, 'tenantId' => $l->tenant_id, 'userId' => $l->user_id, 'action' => $l->action, 'entityType' => $l->entity_type, 'entityId' => $l->entity_id, 'entityName' => $l->entity_name, 'details' => $l->details, 'createdAt' => $l->created_at]);

        $expenseCategories = ExpenseCategory::where('tenant_id', $tenantId)->get()->map(fn($c) => ['id' => $c->id, 'name' => $c->name, 'tenantId' => $c->tenant_id]);

        $cashRegisters = CashRegister::where('tenant_id', $tenantId)->get()->map(fn($cr) => ['id' => $cr->id, 'name' => $cr->name, 'is_default' => $cr->is_default]);


        $backup = [
            'version'   => '2.0',
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
            ],
        ];

        return response()->json($backup)->header('Content-Disposition', 'attachment; filename="crm-backup-' . now()->format('Y-m-d') . '.json"');
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
        $data = $backup['data'];

        DB::transaction(function () use ($data, $tenantId) {
            // Import services & custom fields
            $serviceIdMap = [];
            foreach (($data['services'] ?? []) as $s) {
                $service = Service::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $s['name']],
                    ['config' => $s['config'] ?? '{}']
                );
                $serviceIdMap[$s['id']] = $service->id;

                foreach (($s['customfield'] ?? []) as $cf) {
                    $service->customFields()->updateOrCreate(
                        ['label' => $cf['label'], 'service_id' => $service->id],
                        ['type' => $cf['type'], 'required' => $cf['required'] ?? false, 'order' => $cf['order'] ?? 0]
                    );
                }
            }

            // Import job statuses
            $statusIdMap = [];
            foreach (($data['jobstatuses'] ?? []) as $s) {
                $status = JobStatus::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $s['name']],
                    ['color' => $s['color'], 'order' => $s['order'] ?? 0]
                );
                $statusIdMap[$s['id']] = $status->id;
            }

            // Import step templates
            foreach (($data['steptemplates'] ?? []) as $t) {
                $template = StepTemplate::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $t['name']],
                    []
                );
                foreach (($t['defaultstep'] ?? []) as $step) {
                    $template->defaultSteps()->updateOrCreate(
                        ['title' => $step['title'], 'template_id' => $template->id],
                        ['order' => $step['order'] ?? 0, 'tenant_id' => $tenantId]
                    );
                }
            }

            // Import customers
            $customerIdMap = [];
            foreach (($data['customers'] ?? []) as $c) {
                $customer = Customer::updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $c['name'], 'phone' => $c['phone']],
                    ['email' => $c['email'], 'notes' => $c['notes']]
                );
                $customerIdMap[$c['id']] = $customer->id;
            }

            // Import jobs
            $jobIdMap = [];
            foreach (($data['jobs'] ?? []) as $j) {
                $customerId = $customerIdMap[$j['customerId']] ?? null;
                if (!$customerId) continue;

                $job = JobCrm::updateOrCreate(
                    ['tenant_id' => $tenantId, 'title' => $j['title'], 'customer_id' => $customerId],
                    [
                        'service_id'    => isset($j['serviceId']) && isset($serviceIdMap[$j['serviceId']]) ? $serviceIdMap[$j['serviceId']] : null,
                        'job_status_id' => isset($j['jobStatusId']) && isset($statusIdMap[$j['jobStatusId']]) ? $statusIdMap[$j['jobStatusId']] : null,
                        'description'   => $j['description'],
                        'status'        => $j['status'] ?? 'PENDING',
                        'start_date'    => isset($j['startDate']) ? substr($j['startDate'], 0, 10) : now()->toDateString(),
                        'end_date'      => isset($j['endDate']) ? substr($j['endDate'], 0, 10) : null,
                        'total_price'   => $j['totalPrice'] ?? 0,
                    ]
                );
                $jobIdMap[$j['id']] = $job->id;

                // Restore job detail
                if (!empty($j['jobdetail'])) {
                    $job->jobDetail()->updateOrCreate(
                        ['job_id' => $job->id],
                        ['customer_requests' => $j['jobdetail']['customerRequests'] ?? null, 'notes' => $j['jobdetail']['notes'] ?? null]
                    );
                }

                // Restore job steps
                if (!empty($j['jobstep'])) {
                    $job->jobSteps()->delete();
                    foreach ($j['jobstep'] as $step) {
                        $job->jobSteps()->create(['title' => $step['title'], 'is_completed' => $step['isCompleted'] ?? false, 'order' => $step['order'] ?? 0]);
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
                        []
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
                        ['is_default' => $cr['is_default'] ?? $cr['isDefault'] ?? false]
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
                        ]
                    );
                }
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
                        'cash_register_id' => $cashRegisterId
                    ]
                );
            }
        });

        return response()->json(['message' => 'Yedek başarıyla içe aktarıldı.']);
    }

    /**
     * Clear all data for the current tenant
     */
    public function reset(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        DB::transaction(function () use ($tenantId) {
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
        });

        return response()->json(['message' => 'Tüm verileriniz başarıyla sıfırlandı.']);
    }
}
