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
        return response()->json(JobStatus::where('tenant_id', $tenantId)->orderBy('order')->get());
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

    public function destroy(Request $request, int $id): JsonResponse
    {
        JobStatus::where('tenant_id', $request->user()->tenant_id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Durum silindi.']);
    }
}
