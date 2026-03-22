<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AppointmentController extends Controller
{
    use HasTenantCache;

    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('appointments');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            $tenantId = $request->user()->tenant_id;

            $query = Appointment::where('tenant_id', $tenantId)
                ->with('customer')
                ->orderBy('start_time');

            if ($request->has('customerId')) {
                $query->where('customer_id', $request->customerId);
            }

            if ($request->has('start')) {
                $query->where('start_time', '>=', $request->start);
            }

            if ($request->has('end')) {
                $query->where('start_time', '<=', $request->end);
            }

            return $query->get()->map(fn($a) => [
                'id'          => $a->id,
                'customerId'  => $a->customer_id,
                'customer'    => ['name' => $a->customer?->name],
                'title'       => $a->title,
                'description' => $a->description,
                'startTime'   => $a->start_time,
                'endTime'     => $a->end_time,
                'status'      => $a->status,
                'createdAt'   => $a->created_at,
            ])->toArray();
        });

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customerId'  => 'required|integer',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'startTime'   => 'required|date',
            'endTime'     => 'required|date|after:startTime',
            'status'      => 'nullable|string|in:PENDING,COMPLETED,CANCELLED',
        ]);

        $tenantId = $request->user()->tenant_id;

        $appointment = Appointment::create([
            'tenant_id'   => $tenantId,
            'customer_id' => $validated['customerId'],
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_time'  => $validated['startTime'],
            'end_time'    => $validated['endTime'],
            'status'      => $validated['status'] ?? 'PENDING',
        ]);

        ActivityLogService::log($request->user(), 'CREATE', 'APPOINTMENT', $appointment->id, $appointment->title,
            "{$appointment->title} isimli randevu oluşturuldu.");

        return response()->json($appointment, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $appointment = Appointment::where('tenant_id', $tenantId)->with('customer')->findOrFail($id);

        return response()->json([
            'id'          => $appointment->id,
            'customerId'  => $appointment->customer_id,
            'customer'    => ['name' => $appointment->customer?->name],
            'title'       => $appointment->title,
            'description' => $appointment->description,
            'startTime'   => $appointment->start_time,
            'endTime'     => $appointment->end_time,
            'status'      => $appointment->status,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $appointment = Appointment::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'customerId'  => 'sometimes|integer',
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'startTime'   => 'sometimes|date',
            'endTime'     => 'sometimes|date|after:startTime',
            'status'      => 'nullable|string|in:PENDING,COMPLETED,CANCELLED',
        ]);

        $appointment->update([
            'customer_id' => $validated['customerId'] ?? $appointment->customer_id,
            'title'       => $validated['title'] ?? $appointment->title,
            'description' => $validated['description'] ?? $appointment->description,
            'start_time'  => $validated['startTime'] ?? $appointment->start_time,
            'end_time'    => $validated['endTime'] ?? $appointment->end_time,
            'status'      => $validated['status'] ?? $appointment->status,
        ]);

        ActivityLogService::log($request->user(), 'UPDATE', 'APPOINTMENT', $appointment->id, $appointment->title,
            "{$appointment->title} isimli randevu güncellendi.");

        return response()->json($appointment);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $appointment = Appointment::where('tenant_id', $tenantId)->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'APPOINTMENT', $appointment->id, $appointment->title,
            "{$appointment->title} isimli randevu silindi.");

        $appointment->delete();

        return response()->json(['message' => 'Randevu silindi.']);
    }
}
