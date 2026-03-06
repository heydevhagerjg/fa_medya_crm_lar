<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PaymentController extends Controller
{
    use HasTenantCache;

    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('payments');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            $tenantId = $request->user()->tenant_id;

            $query = Payment::where('tenant_id', $tenantId)
                ->with(['job.customer', 'cashRegister'])
                ->orderByDesc('payment_date');

            if ($request->has('jobId')) {
                $query->where('job_id', $request->jobId);
            }

            return $query->get()->toArray();
        });

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jobId'          => 'nullable|integer',
            'amount'         => 'required|numeric|min:0',
            'paymentDate'    => 'required|date',
            'paymentType'    => 'required|in:ADVANCE,PARTIAL,FINAL',
            'description'    => 'nullable|string',
            'cashRegisterId' => 'nullable|integer',
        ]);

        $tenantId = $request->user()->tenant_id;

        $payment = Payment::create([
            'tenant_id'        => $tenantId,
            'job_id'           => $validated['jobId'] ?? null,
            'amount'           => $validated['amount'],
            'payment_date'     => $validated['paymentDate'],
            'payment_type'     => $validated['paymentType'],
            'description'      => $validated['description'] ?? null,
            'cash_register_id' => $validated['cashRegisterId'] ?? null,
        ]);

        $this->clearTenantCache('payments');
        $this->clearTenantCache('jobs'); // Total paid amount changes

        $payment->load('job');
        $jobTitle = $payment->job?->title ?? 'Genel';

        ActivityLogService::log($request->user(), 'CREATE', 'PAYMENT', $payment->id, $jobTitle,
            "{$jobTitle} işi için {$payment->amount} TL ödeme alındı.");

        return response()->json($payment->fresh()->load(['job.customer', 'cashRegister']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $payment = Payment::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'jobId'          => 'nullable|integer',
            'amount'         => 'sometimes|numeric|min:0',
            'paymentDate'    => 'sometimes|date',
            'paymentType'    => 'sometimes|in:ADVANCE,PARTIAL,FINAL',
            'description'    => 'nullable|string',
            'cashRegisterId' => 'nullable|integer',
        ]);

        $payment->update([
            'job_id'           => array_key_exists('jobId', $validated) ? $validated['jobId'] : $payment->job_id,
            'amount'           => $validated['amount'] ?? $payment->amount,
            'payment_date'     => $validated['paymentDate'] ?? $payment->payment_date,
            'payment_type'     => $validated['paymentType'] ?? $payment->payment_type,
            'description'      => $validated['description'] ?? $payment->description,
            'cash_register_id' => array_key_exists('cashRegisterId', $validated) ? $validated['cashRegisterId'] : $payment->cash_register_id,
        ]);

        $this->clearTenantCache('payments');
        $this->clearTenantCache('jobs');

        $payment->load('job');
        $jobTitle = $payment->job?->title ?? 'Genel';

        ActivityLogService::log($request->user(), 'UPDATE', 'PAYMENT', $payment->id, $jobTitle,
            "{$jobTitle} işi için ödeme güncellendi. Yeni tutar: {$payment->amount} TL");

        return response()->json($payment->fresh()->load(['job.customer', 'cashRegister']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $payment = Payment::where('tenant_id', $tenantId)->findOrFail($id);

        $payment->load('job');
        $jobTitle = $payment->job?->title ?? 'Genel';

        ActivityLogService::log($request->user(), 'DELETE', 'PAYMENT', $payment->id, $jobTitle,
            "{$jobTitle} işindeki {$payment->amount} TL'lik ödeme silindi.");

        $payment->delete();
        $this->clearTenantCache('payments');
        $this->clearTenantCache('jobs');

        return response()->json(['message' => 'Ödeme silindi.']);
    }
}
