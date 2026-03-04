<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\JobStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $statuses = JobStatus::where('tenant_id', $tenantId)->orderBy('order')->get();
        if ($statuses->isEmpty()) {
            $default = JobStatus::create([
                'tenant_id' => $tenantId,
                'name'      => 'Varsayılan',
                'color'     => '#6366f1',
                'order'     => 0,
            ]);
            $statuses = collect([$default]);
        }
        return response()->json($statuses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'order' => 'nullable|integer',
        ]);

        $status = JobStatus::create(array_merge($validated, ['tenant_id' => $request->user()->tenant_id]));
        return response()->json($status, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $status = JobStatus::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $status->update($request->only(['name', 'color', 'order']));
        return response()->json($status);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'statuses' => 'required|array',
            'statuses.*.id' => 'required|integer|exists:job_statuses,id',
            'statuses.*.order' => 'required|integer',
        ]);

        $tenantId = $request->user()->tenant_id;

        foreach ($request->statuses as $s) {
            JobStatus::where('id', $s['id'])
                ->where('tenant_id', $tenantId)
                ->update(['order' => $s['order']]);
        }

        return response()->json(['message' => 'Sıralama güncellendi.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $status = JobStatus::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        
        if ($status->name === 'Varsayılan') {
            return response()->json(['message' => 'Varsayılan durum silinemez.'], 403);
        }

        $status->delete();
        return response()->json(['message' => 'Durum silindi.']);
    }
}
