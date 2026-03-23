<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCrm;
use App\Models\JobDetail;
use App\Models\JobStep;
use App\Models\CustomFieldValue;
use App\Models\JobStatus;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use App\Models\Admin;

class JobController extends Controller
{
    use HasTenantCache;

    private static $globalS3Disk = null;

    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('jobs');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            $user = $request->user();
            $tenantId = $user->tenant_id;

            $query = JobCrm::where('tenant_id', $tenantId)
                ->with(['customer', 'service', 'jobStatus', 'jobSteps', 'payments', 'assignedTo'])
                ->orderBy('order')
                ->orderByDesc('created_at');

            if ($request->has('customerId')) {
                $query->where('customer_id', $request->customerId);
            }

            if ($request->has('jobStatusId')) {
                if ($request->jobStatusId === 'unassigned') {
                    $query->whereNull('job_status_id');
                } else {
                    $query->where('job_status_id', $request->jobStatusId);
                }
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Check if pagination is requested (Kanban and potential infinite scrolls)
            if ($request->has('page') || $request->has('limit')) {
                $limit = (int) $request->get('limit', 15);
                $paginatedJobs = $query->paginate($limit);
                
                return [
                    'data' => collect($paginatedJobs->items())->map(fn($j) => $this->jobResource($j))->toArray(),
                    'meta' => [
                        'current_page' => $paginatedJobs->currentPage(),
                        'last_page' => $paginatedJobs->lastPage(),
                        'per_page' => $paginatedJobs->perPage(),
                        'total' => $paginatedJobs->total(),
                    ],
                ];
            }

            $jobs = $query->get();
            return $jobs->map(fn($j) => $this->jobResource($j))->toArray();
        });

        return response()->json($data);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = JobCrm::where('tenant_id', $tenantId);
        
        // Herkes her işin detayını görebilir.


        $job = $query->with([
                'customer', 'service.customFields', 'jobStatus',
                'jobDetail', 'jobFiles', 'jobSteps', 'installments',
                'payments.cashRegister', 'customFieldValues.customField',
                'expenses.category', 'expenses.cashRegister',
                'assignedTo'
            ])
            ->findOrFail($id);

        return response()->json($this->jobDetailResource($job));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customerId'    => 'required|integer',
            'serviceId'     => 'nullable|integer',
            'jobStatusId'   => 'nullable|integer',
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'status'        => 'nullable|string|in:PENDING,IN_PROGRESS,COMPLETED,CANCELLED',
            'totalPrice'    => 'nullable|numeric|min:0',
            'startDate'     => 'nullable|date',
            'endDate'       => 'nullable|date',
            'customFields'  => 'nullable|array',
            'steps'         => 'nullable|array',
            'steps.*'       => 'string',
            'userId'        => 'nullable|uuid|exists:users,id',
            'customerRequests' => 'nullable|string',
            'notes'         => 'nullable|string',
            'isVatIncluded' => 'nullable|boolean',
            'vatRate'       => 'nullable|integer|min:0',
            'subtotal'      => 'nullable|numeric|min:0',
            'vatAmount'     => 'nullable|numeric|min:0',
        ]);

        if (!empty($validated['userId'])) {
            $assignedUser = \App\Models\User::where('tenant_id', $request->user()->tenant_id)->find($validated['userId']);
            if (!$assignedUser) {
                return response()->json(['message' => 'Geçersiz personel seçimi.'], 422);
            }
        }

        $tenantId = $request->user()->tenant_id;

        $job = DB::transaction(function () use ($validated, $tenantId, $request) {
            $jobStatusId = $validated['jobStatusId'] ?? null;
            if (!$jobStatusId) {
                // Fetch first status for tenant
                $ds = JobStatus::where('tenant_id', $tenantId)->orderBy('order')->first();
                if (!$ds) {
                    $ds = JobStatus::create([
                        'tenant_id' => $tenantId,
                        'name'      => 'Varsayılan',
                        'color'     => '#6366f1',
                        'order'     => 0,
                    ]);
                }
                $jobStatusId = $ds->id;
            }

            $job = JobCrm::create([
                'tenant_id'     => $tenantId,
                'customer_id'   => $validated['customerId'],
                'service_id'    => $validated['serviceId'] ?? null,
                'job_status_id' => $jobStatusId,
                'title'         => $validated['title'],
                'description'   => $validated['description'] ?? null,
                'status'        => $validated['status'] ?? 'PENDING',
                'total_price'   => $validated['totalPrice'] ?? 0,
                'start_date'    => $validated['startDate'] ?? now(),
                'end_date'      => $validated['endDate'] ?? null,
                'user_id'       => $validated['userId'] ?? null,
                'is_vat_included' => $validated['isVatIncluded'] ?? false,
                'vat_rate'        => $validated['vatRate'] ?? 0,
                'subtotal'        => $validated['subtotal'] ?? ($validated['totalPrice'] ?? 0),
                'vat_amount'      => $validated['vatAmount'] ?? 0,
            ]);

            if (!empty($validated['steps'])) {
                $steps = array_map(fn($title, $i) => [
                    'job_id' => $job->id,
                    'title'  => $title,
                    'order'  => $i,
                    'is_completed' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], $validated['steps'], array_keys($validated['steps']));

                JobStep::insert($steps);

                ActivityLogService::log($request->user(), 'CREATE', 'STEP', null, $job->title,
                    "{$job->title} işine toplu olarak " . count($steps) . " adet aşama eklendi.");
            }

            if (!empty($validated['customerRequests']) || !empty($validated['notes'])) {
                JobDetail::create([
                    'job_id'            => $job->id,
                    'customer_requests' => $validated['customerRequests'] ?? null,
                    'notes'             => $validated['notes'] ?? null,
                ]);
            }

            if (!empty($validated['customFields'])) {
                foreach ($validated['customFields'] as $fieldId => $value) {
                    CustomFieldValue::create([
                        'job_id'          => $job->id,
                        'custom_field_id' => $fieldId,
                        'value'           => $value,
                    ]);
                }
            }

            return $job;
        });

        ActivityLogService::log($request->user(), 'CREATE', 'JOB', $job->id, $job->title,
            "{$job->title} isimli iş/proje oluşturuldu.");

        return response()->json($this->jobResource($job->load(['customer', 'service', 'jobStatus'])), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        
        $query = JobCrm::where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN') {
            $query->where('user_id', $user->id);
        }
        
        // Also check if they have permission if it's not their own job? 
        // Actually the user stated: "Only assigned personnel and company authorized can make updates"
        if ($user->role !== 'ADMIN' && !$user->can('jobs.edit')) {
            return response()->json(['message' => 'Bu işlem için yetkiniz yok.'], 403);
        }

        $validated = $request->validate([
            'customerId'    => 'sometimes|integer',
            'serviceId'     => 'nullable|integer',
            'jobStatusId'   => 'nullable|integer',
            'title'         => 'sometimes|string|max:255',
            'description'   => 'nullable|string',
            'status'        => 'nullable|string|in:PENDING,IN_PROGRESS,COMPLETED,CANCELLED',
            'totalPrice'    => 'nullable|numeric|min:0',
            'startDate'     => 'nullable|date',
            'endDate'       => 'nullable|date',
            'customFields'  => 'nullable|array',
            'userId'        => 'nullable|uuid|exists:users,id',
            'notes'         => 'nullable|string',
            'isVatIncluded' => 'nullable|boolean',
            'vatRate'       => 'nullable|integer|min:0',
            'subtotal'      => 'nullable|numeric|min:0',
            'vatAmount'     => 'nullable|numeric|min:0',
        ]);

        if (!empty($validated['userId'])) {
            $assignedUser = \App\Models\User::where('tenant_id', $tenantId)->find($validated['userId']);
            if (!$assignedUser) {
                return response()->json(['message' => 'Geçersiz personel seçimi.'], 422);
            }
        }

        $job = $query->findOrFail($id);

        DB::transaction(function () use ($job, $validated, $request) {
            $job->update([
                'customer_id'   => $validated['customerId'] ?? $job->customer_id,
                'service_id'    => array_key_exists('serviceId', $validated) ? $validated['serviceId'] : $job->service_id,
                'job_status_id' => array_key_exists('jobStatusId', $validated) ? $validated['jobStatusId'] : $job->job_status_id,
                'title'         => $validated['title'] ?? $job->title,
                'description'   => array_key_exists('description', $validated) ? $validated['description'] : $job->description,
                'status'        => $validated['status'] ?? $job->status,
                'total_price'   => $validated['totalPrice'] ?? $job->total_price,
                'start_date'    => $validated['startDate'] ?? $job->start_date,
                'end_date'      => array_key_exists('endDate', $validated) ? $validated['endDate'] : $job->end_date,
                'user_id'       => array_key_exists('userId', $validated) ? $validated['userId'] : $job->user_id,
                'is_vat_included' => $validated['isVatIncluded'] ?? $job->is_vat_included,
                'vat_rate'        => $validated['vatRate'] ?? $job->vat_rate,
                'subtotal'        => $validated['subtotal'] ?? $job->subtotal,
                'vat_amount'      => $validated['vatAmount'] ?? $job->vat_amount,
            ]);

            if (isset($validated['customerRequests']) || isset($validated['notes'])) {
                JobDetail::updateOrCreate(
                    ['job_id' => $job->id],
                    [
                        'customer_requests' => $validated['customerRequests'] ?? null,
                        'notes'             => $validated['notes'] ?? null,
                    ]
                );
            }

            if (!empty($validated['customFields'])) {
                foreach ($validated['customFields'] as $fieldId => $value) {
                    CustomFieldValue::updateOrCreate(
                        ['job_id' => $job->id, 'custom_field_id' => $fieldId],
                        ['value' => $value]
                    );
                }
            }
        });

        ActivityLogService::log($request->user(), 'UPDATE', 'JOB', $job->id, $job->title,
            "{$job->title} işinin bilgileri/durumu güncellendi.");

        return response()->json($this->jobResource($job->fresh()->load(['customer', 'service', 'jobStatus'])));
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = JobCrm::where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN') {
            $query->where('user_id', $user->id);
        }

        if ($user->role !== 'ADMIN' && !$user->can('jobs.edit')) {
            return response()->json(['message' => 'Bu işlem için yetkiniz yok.'], 403);
        }

        $job = $query->findOrFail($id);

        $validated = $request->validate([
            'jobStatusId' => 'nullable|integer',
        ]);

        $job->update(['job_status_id' => $validated['jobStatusId'] ?? null]);

        ActivityLogService::log($request->user(), 'UPDATE', 'JOB', $job->id, $job->title,
            "{$job->title} işinin durumu güncellendi.");

        return response()->json($job->fresh()->load('jobStatus'));
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jobs' => 'required|array',
            'jobs.*.id' => 'required|integer',
            'jobs.*.order' => 'required|integer',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;

        DB::transaction(function () use ($validated, $tenantId, $user) {
            foreach ($validated['jobs'] as $jobData) {
                $query = JobCrm::where('tenant_id', $tenantId)->where('id', $jobData['id']);
                
                if ($user->role !== 'ADMIN') {
                    $query->where('user_id', $user->id);
                }
                
                if ($user->role !== 'ADMIN' && !$user->can('jobs.edit')) {
                    continue;
                }
                
                $query->update(['order' => $jobData['order']]);
            }
        });

        // Bulk update doesn't trigger model events, so we clear cache manually
        $this->clearTenantCache('jobs', $tenantId);

        return response()->json(['message' => 'Sıralama güncellendi.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = JobCrm::where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN') {
            $query->where('user_id', $user->id);
        }

        if ($user->role !== 'ADMIN' && !$user->can('jobs.delete')) {
            return response()->json(['message' => 'Bu işlem için yetkiniz yok.'], 403);
        }

        $job = $query->with('payments')->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'JOB', $job->id, $job->title,
            "{$job->title} işi sistemden silindi.");

        if (true) { // disk is now configured via middleware
            $s3 = Storage::disk('s3_global');
            
            // İşin dosyalarını içeren klasörü sil
            $s3->deleteDirectory("tenants/{$tenantId}/jobs/{$job->id}");
            
            // İşin ödemelerine ait dekontları sil
            foreach ($job->payments as $payment) {
                if ($payment->receipt_path) {
                    $s3->delete($payment->receipt_path);
                }
            }
        }

        $job->delete();

        return response()->json(['message' => 'İş silindi.']);
    }

    private function jobResource(JobCrm $job): array
    {
        return [
            'id'          => $job->id,
            'tenantId'    => $job->tenant_id,
            'customerId'  => $job->customer_id,
            'serviceId'   => $job->service_id,
            'jobStatusId' => $job->job_status_id,
            'title'       => $job->title,
            'description' => $job->description,
            'status'      => $job->status,
            'startDate'   => $job->start_date,
            'endDate'     => $job->end_date,
            'totalPrice'  => $job->total_price,
            'isVatIncluded' => $job->is_vat_included,
            'vatRate'       => $job->vat_rate,
            'subtotal'      => $job->subtotal,
            'vatAmount'     => $job->vat_amount,
            'proposalId'    => $job->proposal_id,
            'createdAt'   => $job->created_at,
            'updatedAt'   => $job->updated_at,
            'userId'      => $job->user_id,
            'assignedTo'  => $job->relationLoaded('assignedTo') ? $job->assignedTo : null,
            'customer'    => $job->relationLoaded('customer') ? $job->customer : null,
            'service'     => $job->relationLoaded('service') ? $job->service : null,
            'jobStatus'   => $job->relationLoaded('jobStatus') ? $job->jobStatus : null,
            'jobstep'     => $job->relationLoaded('jobSteps') ? $job->jobSteps : [],
            'payment'     => $job->relationLoaded('payments') ? $job->payments : [],
        ];
    }

    private function jobDetailResource(JobCrm $job): array
    {
        $base = $this->jobResource($job);
        $base['jobdetail']        = $job->jobDetail;
        $base['jobfile']          = $job->jobFiles;
        $base['jobstep']          = $job->jobSteps;
        $base['payment']          = $job->payments;
        $base['expense']          = $job->expenses;
        $base['customfieldvalue'] = $job->customFieldValues;
        
        // If job belongs to a proposal, use proposal's installments for shared view
        if ($job->proposal_id) {
            $base['installments'] = \App\Models\ProposalInstallment::where('proposal_id', $job->proposal_id)
                ->orderBy('id', 'asc')
                ->get();
        } else {
            $base['installments'] = $job->installments;
        }
        return $base;
    }
}
