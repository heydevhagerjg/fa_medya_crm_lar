<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashRegisterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        return response()->json(CashRegister::where('tenant_id', $tenantId)->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'is_default' => 'nullable|boolean',
        ]);

        $tenantId = $request->user()->tenant_id;

        if (!empty($validated['is_default'])) {
            CashRegister::where('tenant_id', $tenantId)->update(['is_default' => false]);
        }

        $register = CashRegister::create(array_merge($validated, ['tenant_id' => $tenantId]));
        return response()->json($register, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $register = CashRegister::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            CashRegister::where('tenant_id', $tenantId)->where('id', '!=', $id)->update(['is_default' => false]);
        }

        $register->update($validated);
        return response()->json($register);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        CashRegister::where('tenant_id', $request->user()->tenant_id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Kasa silindi.']);
    }
}
