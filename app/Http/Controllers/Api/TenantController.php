<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($request->user()->tenant_id);
        
        return response()->json([
            'id'    => $tenant->id,
            'name'  => $tenant->name,
            'slug'  => $tenant->slug,
            'import_key'            => $tenant->import_key,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($request->user()->tenant_id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'import_key'            => 'nullable|string|max:255',
        ]);

        $tenant->update($validated);

        return response()->json(['message' => 'Ayarlar güncellendi.', 'tenant' => $tenant]);
    }

}
