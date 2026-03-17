<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $roles = \App\Models\Role::where('tenant_id', $tenantId)
            ->with('permissions')
            ->get();

        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $tenantId = $request->user()->tenant_id;

        // Check if role already exists for this tenant
        if (\App\Models\Role::where('tenant_id', $tenantId)->where('name', $validated['name'])->exists()) {
            return response()->json(['message' => 'Bu isimde bir rol zaten mevcut.'], 422);
        }

        $role = \App\Models\Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'tenant_id' => $tenantId,
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    public function show(Request $request, string $id)
    {
        $tenantId = $request->user()->tenant_id;
        $role = \App\Models\Role::where('tenant_id', $tenantId)
            ->with('permissions')
            ->findOrFail($id);

        return response()->json($role);
    }

    public function update(Request $request, string $id)
    {
        $tenantId = $request->user()->tenant_id;
        $role = \App\Models\Role::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json($role->load('permissions'));
    }

    public function destroy(Request $request, string $id)
    {
        $tenantId = $request->user()->tenant_id;
        $role = \App\Models\Role::where('tenant_id', $tenantId)->findOrFail($id);

        // Prevent deleting admin role if it's the only one or something
        // But for now, just delete
        $role->delete();

        return response()->json(['message' => 'Rol silindi.']);
    }
}
