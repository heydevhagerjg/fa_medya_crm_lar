<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\ServiceTrackingCategory;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceTrackingCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        return response()->json(ServiceTrackingCategory::where('tenant_id', $tenantId)->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $category = ServiceTrackingCategory::create(array_merge($validated, ['tenant_id' => $request->user()->tenant_id]));

        ActivityLogService::log($request->user(), 'CREATE', 'SERVICE_TRACKING_CATEGORY', $category->id, $category->name,
            "{$category->name} isimli hizmet takip kategorisi oluşturuldu.");

        return response()->json($category, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = ServiceTrackingCategory::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $category->update($request->validate(['name' => 'required|string|max:255']));

        ActivityLogService::log($request->user(), 'UPDATE', 'SERVICE_TRACKING_CATEGORY', $category->id, $category->name,
            "{$category->name} isimli hizmet takip kategorisi güncellendi.");

        return response()->json($category);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = ServiceTrackingCategory::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'SERVICE_TRACKING_CATEGORY', $category->id, $category->name,
            "{$category->name} isimli hizmet takip kategorisi silindi.");

        $category->delete();
        return response()->json(['message' => 'Kategori silindi.']);
    }
}
