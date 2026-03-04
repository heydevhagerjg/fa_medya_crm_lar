<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\BackupKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BackupKeyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $keys = BackupKey::where('tenant_id', $request->user()->tenant_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($keys);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255'
        ]);

        $key = BackupKey::create([
            'tenant_id' => $request->user()->tenant_id,
            'key'       => \Illuminate\Support\Str::random(40),
            'name'      => $validated['name'] ?? 'Manuel Key - ' . now()->format('d.m.Y H:i')
        ]);

        return response()->json(['message' => 'Yeni key başarıyla oluşturuldu.', 'key' => $key], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $key = BackupKey::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $key->delete();

        return response()->json(['message' => 'Yedek anahtarı silindi.']);
    }

    public function clearAll(Request $request): JsonResponse
    {
        BackupKey::where('tenant_id', $request->user()->tenant_id)->delete();

        return response()->json(['message' => 'Tüm yedek anahtarları temizlendi.']);
    }
}
