<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::where('tenant_id', $request->user()->tenant_id)
            ->with('roles')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'roleId'   => 'nullable|exists:roles,id',
            'role'     => 'sometimes|in:ADMIN,USER',
        ]);

        $tenantId = $request->user()->tenant_id;

        $user = User::create([
            'id'          => Str::uuid()->toString(),
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($validated['password']),
            'role'        => $validated['role'] ?? 'USER',
            'tenant_id'   => $tenantId,
            'is_approved' => true,
        ]);

        if (!empty($validated['roleId'])) {
            $role = \App\Models\Role::where('tenant_id', $tenantId)->findOrFail($validated['roleId']);
            $user->assignRole($role);
        }

        return response()->json($user->load('roles'), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'roleId'   => 'nullable|exists:roles,id',
            'role'     => 'sometimes|in:ADMIN,USER',
        ]);

        $updateData = [];
        if (isset($validated['name'])) $updateData['name'] = $validated['name'];
        if (isset($validated['email'])) $updateData['email'] = $validated['email'];
        if (!empty($validated['password'])) $updateData['password'] = Hash::make($validated['password']);
        if (isset($validated['role'])) $updateData['role'] = $validated['role'];

        $user->update($updateData);

        if (array_key_exists('roleId', $validated)) {
            if ($validated['roleId']) {
                $role = \App\Models\Role::where('tenant_id', $tenantId)->findOrFail($validated['roleId']);
                $user->syncRoles([$role]);
            } else {
                $user->syncRoles([]);
            }
        }

        return response()->json($user->load('roles'));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Kendinizi silemezsiniz.'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'Kullanıcı silindi.']);
    }
}
