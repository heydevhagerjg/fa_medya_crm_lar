<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiKeyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        return response()->json(ApiKey::where('tenant_id', $tenantId)->orderByDesc('created_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'expires_at'  => 'nullable|date',
        ]);

        $apiKey = ApiKey::create([
            'id'          => Str::uuid()->toString(),
            'key'         => Str::random(64),
            'name'        => $validated['name'] ?? null,
            'tenant_id'   => $request->user()->tenant_id,
            'permissions' => $validated['permissions'] ?? null,
            'expires_at'  => $validated['expires_at'] ?? null,
        ]);

        return response()->json($apiKey, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $apiKey = ApiKey::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'        => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'expires_at'  => 'nullable|date',
        ]);

        $apiKey->update($validated);

        return response()->json($apiKey);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        ApiKey::where('tenant_id', $request->user()->tenant_id)->findOrFail($id)->delete();
        return response()->json(['message' => 'API anahtarı silindi.']);
    }
}
