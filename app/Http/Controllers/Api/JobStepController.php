<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobStep;
use App\Models\JobCrm;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobStepController extends Controller
{
    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $step = JobStep::whereHas('job', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        $validated = $request->validate([
            'isCompleted' => 'required|boolean',
            'title'       => 'sometimes|string|max:255',
        ]);

        $step->update([
            'is_completed' => $validated['isCompleted'],
            'title'        => $validated['title'] ?? $step->title,
        ]);

        $job = $step->job;
        ActivityLogService::log($request->user(), 'UPDATE', 'STEP', $step->id, $job->title,
            "{$job->title} işindeki \"{$step->title}\" aşamasının durumu güncellendi.");

        return response()->json($step->fresh());
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'jobId' => 'required|integer',
            'title' => 'required|string|max:255',
            'order' => 'nullable|integer',
        ]);

        $job = JobCrm::where('tenant_id', $tenantId)->findOrFail($validated['jobId']);

        $step = JobStep::create([
            'job_id' => $job->id,
            'title'  => $validated['title'],
            'order'  => $validated['order'] ?? ($job->jobSteps()->max('order') + 1),
        ]);

        ActivityLogService::log($request->user(), 'CREATE', 'STEP', $step->id, $job->title,
            "{$job->title} işine \"{$step->title}\" aşaması eklendi.");

        return response()->json($step, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $step = JobStep::whereHas('job', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        $job = $step->job;

        ActivityLogService::log($request->user(), 'DELETE', 'STEP', $step->id, $job->title,
            "{$job->title} işinden \"{$step->title}\" aşaması silindi.");

        $step->delete();

        return response()->json(['message' => 'Aşama silindi.']);
    }

    public function applyTemplate(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $validated = $request->validate([
            'templateId' => 'required|integer',
        ]);

        $job = JobCrm::where('tenant_id', $tenantId)->findOrFail($id);
        $template = \App\Models\StepTemplate::where('tenant_id', $tenantId)
            ->with(['defaultSteps' => function($q) {
                $q->orderBy('order');
            }])
            ->findOrFail($validated['templateId']);

        // İşe ait mevcut aşamaları sil
        $job->jobSteps()->delete();
        $maxOrder = 0;

        $newSteps = [];
        foreach ($template->defaultSteps as $defaultStep) {
            $maxOrder++;
            $step = JobStep::create([
                'job_id' => $job->id,
                'title'  => $defaultStep->title,
                'order'  => $maxOrder,
            ]);
            $newSteps[] = $step;
        }

        ActivityLogService::log($request->user(), 'CREATE', 'STEP', $template->id, $job->title,
            "{$job->title} işine \"{$template->name}\" şablonu eklendi.");

        return response()->json(['message' => 'Şablon eklendi', 'steps' => $newSteps], 201);
    }
}
