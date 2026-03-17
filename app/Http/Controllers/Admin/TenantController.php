<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::withCount('users')->get();
        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tenant = Tenant::create([
            'id' => Str::uuid()->toString(),
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . rand(1000, 9999),
        ]);

        return response()->json($tenant, 201);
    }

    public function show($id)
    {
        $tenant = Tenant::with(['users' => function($q) {
            $q->select('id', 'name', 'email', 'role', 'is_approved', 'tenant_id', 'created_at');
        }])->findOrFail($id);
        return response()->json($tenant);
    }

    public function addUser(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:ADMIN,USER',
        ]);

        $user = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_approved' => true,
            'tenant_id' => $tenant->id,
        ]);

        return response()->json($user, 201);
    }

    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();

        return response()->json(['message' => 'Tenant deleted successfully']);
    }
}
