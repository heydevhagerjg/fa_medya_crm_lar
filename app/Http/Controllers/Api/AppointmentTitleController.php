<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppointmentTitle;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AppointmentTitleController extends Controller
{
    use HasTenantCache;

    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('appointment_titles');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            return AppointmentTitle::where('tenant_id', $request->user()->tenant_id)
                ->orderBy('name')
                ->get();
        });

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $title = AppointmentTitle::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
        ]);

        return response()->json($title, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $title = AppointmentTitle::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $title->update($validated);

        return response()->json($title);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $title = AppointmentTitle::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $title->delete();

        return response()->json(['message' => 'Başlık silindi.']);
    }
}
