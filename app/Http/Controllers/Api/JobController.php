<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCrm;
use App\Models\JobDetail;
use App\Models\JobStep;
use App\Models\CustomFieldValue;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $query = JobCrm::where('tenant_id', $tenantId)
            ->with(['customer', 'service', 'jobStatus', 'jobSteps', 'payments'])
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

        if ($request->has('page')) {
            $limit = $request->input('limit', 15);
            $paginated = $query->paginate($limit);
            
            return response()->json([
                'data' => collect($paginated->items())->map(fn($j) => $this->jobResource($j)),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'total' => $paginated->total(),
                    'per_page' => $paginated->perPage(),
                ]
            ]);
        }

        return response()->json($query->get()->map(fn($j) => $this->jobResource($j)));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $job = JobCrm::where('tenant_id', $tenantId)
            ->with([
                'customer', 'service.customFields', 'jobStatus',
                'jobDetail', 'jobFiles', 'jobSteps',
                'payments.cashRegister', 'customFieldValues.customField',
                'expenses.category', 'expenses.cashRegister',
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
            'customerRequests' => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

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
        $tenantId = $request->user()->tenant_id;
        $job = JobCrm::where('tenant_id', $tenantId)->findOrFail($id);

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
            'customerRequests' => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

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
        $tenantId = $request->user()->tenant_id;
        $job = JobCrm::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'jobStatusId' => 'required|integer',
        ]);

        $job->update(['job_status_id' => $validated['jobStatusId']]);

        ActivityLogService::log($request->user(), 'UPDATE', 'JOB', $job->id, $job->title,
            "{$job->title} işinin durumu güncellendi.");

        return response()->json($job->fresh()->load('jobStatus'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $job = JobCrm::where('tenant_id', $tenantId)->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'JOB', $job->id, $job->title,
            "{$job->title} işi sistemden silindi.");

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
            'createdAt'   => $job->created_at,
            'updatedAt'   => $job->updated_at,
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
        return $base;
    }
}
