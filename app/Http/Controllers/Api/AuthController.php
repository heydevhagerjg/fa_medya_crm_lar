<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8|confirmed',
            'tenant_name' => 'required|string|max:255',
        ]);

        // Create tenant
        $tenantId = Str::uuid()->toString();
        $slug = Str::slug($validated['tenant_name']) . '-' . Str::random(6);
        $tenant = Tenant::create([
            'id'   => $tenantId,
            'name' => $validated['tenant_name'],
            'slug' => $slug,
        ]);

        // Create default cash register for tenant
        $tenant->cashRegisters()->create([
            'name'       => 'Varsayılan Kasa',
            'is_default' => true,
        ]);

        // Create user as ADMIN
        $user = User::create([
            'id'          => Str::uuid()->toString(),
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($validated['password']),
            'role'        => 'ADMIN',
            'is_approved' => true,
            'tenant_id'   => $tenantId,
        ]);

        $token = $user->createToken('auth_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'user'  => $this->userResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-posta veya şifre hatalı.'],
            ]);
        }

        if (!$user->is_approved) {
            return response()->json(['message' => 'Hesabınız henüz onaylanmamış.'], 403);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'user'  => $this->userResource($user->load('tenant')),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Çıkış yapıldı.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userResource($request->user()->load('tenant')));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'password'         => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Mevcut şifre hatalı.'], 422);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        return response()->json(['message' => 'Şifre başarıyla değiştirildi.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $request->user()->update(['name' => $validated['name']]);

        return response()->json($this->userResource($request->user()->load('tenant')));
    }

    private function userResource(User $user): array
    {
        $data = [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'is_approved' => $user->is_approved,
            'tenant_id'   => $user->tenant_id,
        ];

        if ($user->relationLoaded('tenant') && $user->tenant) {
            $data['tenant'] = [
                'id'   => $user->tenant->id,
                'name' => $user->tenant->name,
                'slug' => $user->tenant->slug,
            ];
        }

        return $data;
    }
}
