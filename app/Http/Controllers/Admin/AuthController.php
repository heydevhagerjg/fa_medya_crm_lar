<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $admin = Admin::where('email', $validated['email'])->first();

        if (!$admin || !Hash::check($validated['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['DEBUG: CONTROLLER REACHED BUT AUTH FAILED'],
            ]);
        }

        $device = $request->header('User-Agent', 'Unknown Admin Device');
        $token = $admin->createToken($device, ['admin'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'user'  => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'type' => 'admin',
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Çıkış yapıldı.']);
    }

    public function me(Request $request)
    {
        $admin = $request->user();
        return response()->json([
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'type' => 'admin',
        ]);
    }
}
