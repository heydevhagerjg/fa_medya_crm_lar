<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $page = max(1, (int) $request->get('page', 1));
        $limit = max(1, (int) $request->get('limit', 50));

        $query = ActivityLog::with('user')->where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN') {
            $query->where('user_id', $user->id);
        }

        $logs = $query->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'logs'  => $logs->items(),
            'total' => $logs->total(),
            'page'  => $page,
            'limit' => $limit,
        ]);
    }
}
