<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $customers = Customer::where('tenant_id', $tenantId)
            ->withCount('jobs')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($customers->map(function ($c) {
            return [
                'id'         => $c->id,
                'tenantId'   => $c->tenant_id,
                'name'       => $c->name,
                'phone'      => $c->phone,
                'email'      => $c->email,
                'notes'      => $c->notes,
                'createdAt'  => $c->created_at,
                'updatedAt'  => $c->updated_at,
                '_count'     => ['job' => $c->jobs_count],
            ];
        }));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $customer = Customer::where('tenant_id', $tenantId)
            ->with(['jobs' => function ($q) {
                $q->with(['jobStatus', 'jobSteps', 'payments'])
                  ->orderByDesc('created_at');
            }])
            ->findOrFail($id);

        return response()->json([
            'id'        => $customer->id,
            'tenantId'  => $customer->tenant_id,
            'name'      => $customer->name,
            'phone'     => $customer->phone,
            'email'     => $customer->email,
            'notes'     => $customer->notes,
            'createdAt' => $customer->created_at,
            'updatedAt' => $customer->updated_at,
            'job'       => $customer->jobs->map(fn($j) => [
                'id'          => $j->id,
                'title'       => $j->title,
                'status'      => $j->status,
                'total_price' => $j->total_price,
                'start_date'  => $j->start_date,
                'jobStatus'   => $j->jobStatus,
                'payment'     => $j->payments->map(fn($p) => ['id' => $p->id, 'amount' => $p->amount]),
                'jobstep'     => $j->jobSteps->map(fn($s) => ['id' => $s->id, 'is_completed' => $s->is_completed]),
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
        ]);

        $tenantId = $request->user()->tenant_id;
        $customer = Customer::create(array_merge($validated, ['tenant_id' => $tenantId]));

        ActivityLogService::log($request->user(), 'CREATE', 'CUSTOMER', $customer->id, $customer->name,
            "{$customer->name} isimli müşteri oluşturuldu.");

        return response()->json($customer, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $customer = Customer::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
        ]);

        $customer->update($validated);

        ActivityLogService::log($request->user(), 'UPDATE', 'CUSTOMER', $customer->id, $customer->name,
            "{$customer->name} isimli müşteri güncellendi.");

        return response()->json($customer);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $customer = Customer::where('tenant_id', $tenantId)->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'CUSTOMER', $customer->id, $customer->name,
            "{$customer->name} isimli müşteri silindi.");

        $customer->delete();

        return response()->json(['message' => 'Müşteri silindi.']);
    }
}
