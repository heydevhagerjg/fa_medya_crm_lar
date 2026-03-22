<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Admin;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    use HasTenantCache;

    private static $globalS3Disk = null;


    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('payments');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            $user = $request->user();
            $tenantId = $user->tenant_id;
            $limit = $request->input('limit', 15);

            $query = Payment::where('tenant_id', $tenantId)
                ->with(['job.customer', 'cashRegister'])
                ->orderByDesc('payment_date');

            if ($user->role !== 'ADMIN' && !$user->can('payments.view_all')) {
                $query->whereHas('job', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }

            if ($request->has('jobId')) {
                $query->where('job_id', $request->jobId);
            }
            $payments = $query->get();

            return $payments->map(fn($p) => $this->paymentResource($p))->toArray();
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
            'receipt'        => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;

        // If job is specified, verify ownership
        if (!empty($validated['jobId']) && $user->role !== 'ADMIN') {
            $jobQuery = \App\Models\JobCrm::where('tenant_id', $tenantId);
            if (!$user->can('payments.view_all')) {
                $jobQuery->where('user_id', $user->id);
            }
            $jobQuery->findOrFail($validated['jobId']);
        } elseif (empty($validated['jobId']) && $user->role !== 'ADMIN') {
            if (!$user->can('payments.view_all')) {
                return response()->json(['message' => 'Genel ödeme girişi yetkiniz bulunmamaktadır.'], 403);
            }
        }

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $file = $request->file('receipt');
            $extension = strtolower($file->getClientOriginalExtension());
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

            if (!in_array($extension, $allowedExtensions)) {
                return response()->json(['message' => 'Geçersiz dosya uzantısı.'], 422);
            }

            // Secure MIME check
            $mimeType = $file->getMimeType();
            $allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!in_array($mimeType, $allowedMimes)) {
                return response()->json(['message' => 'Geçersiz dosya türü.'], 422);
            }

            $receiptPath = $file->store('tenants/' . $tenantId . '/receipts', 's3_global');
        }

        $payment = Payment::create([
            'tenant_id'        => $tenantId,
            'job_id'           => $validated['jobId'] ?? null,
            'amount'           => $validated['amount'],
            'payment_date'     => $validated['paymentDate'],
            'payment_type'     => $validated['paymentType'],
            'description'      => $validated['description'] ?? null,
            'cash_register_id' => $validated['cashRegisterId'] ?? null,
            'receipt_path'     => $receiptPath,
        ]);

        // Automated cache clear via Model (HasTenantCache)

        $payment->load('job');
        $jobTitle = $payment->job?->title ?? 'Genel';

        ActivityLogService::log($request->user(), 'CREATE', 'PAYMENT', $payment->id, $jobTitle,
            "{$jobTitle} işi için {$payment->amount} TL ödeme alındı.");

        return response()->json($this->paymentResource($payment->fresh()->load(['job.customer', 'cashRegister'])), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'ADMIN' && !$user->can('payments.edit')) {
            return response()->json(['message' => 'Tahsilat düzeltme işlemi için yetkiniz bulunmamaktadır.'], 403);
        }

        $tenantId = $user->tenant_id;

        $query = Payment::where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN' && !$user->can('payments.view_all')) {
            $query->whereHas('job', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        $payment = $query->findOrFail($id);

        $validated = $request->validate([
            'jobId'          => 'nullable|integer',
            'amount'         => 'sometimes|numeric|min:0',
            'paymentDate'    => 'sometimes|date',
            'paymentType'    => 'sometimes|in:ADVANCE,PARTIAL,FINAL',
            'description'    => 'nullable|string',
            'cashRegisterId' => 'nullable|integer',
            'receipt'        => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $receiptPath = $payment->receipt_path;
        if ($request->hasFile('receipt')) {
            if ($receiptPath) {
                Storage::disk('s3_global')->delete($receiptPath);
            }
            $receiptPath = $request->file('receipt')->store('tenants/' . $tenantId . '/receipts', 's3_global');
        }

        $payment->update([
            'job_id'           => array_key_exists('jobId', $validated) ? $validated['jobId'] : $payment->job_id,
            'amount'           => $validated['amount'] ?? $payment->amount,
            'payment_date'     => $validated['paymentDate'] ?? $payment->payment_date,
            'payment_type'     => $validated['paymentType'] ?? $payment->payment_type,
            'description'      => $validated['description'] ?? $payment->description,
            'cash_register_id' => array_key_exists('cashRegisterId', $validated) ? $validated['cashRegisterId'] : $payment->cash_register_id,
            'receipt_path'     => $receiptPath,
        ]);

        // Automated cache clear via Model (HasTenantCache)

        $payment->load('job');
        $jobTitle = $payment->job?->title ?? 'Genel';

        ActivityLogService::log($request->user(), 'UPDATE', 'PAYMENT', $payment->id, $jobTitle,
            "{$jobTitle} işi için ödeme güncellendi. Yeni tutar: {$payment->amount} TL");

        return response()->json($this->paymentResource($payment->fresh()->load(['job.customer', 'cashRegister'])));
    }

    private function paymentResource($payment)
    {
        $data = $payment instanceof Payment ? $payment->toArray() : $payment;
        if (!empty($data['receipt_path'])) {
            // Use a local proxy URL instead of a direct S3 URL
            $data['receiptUrl'] = "/api/payments/" . $data['id'] . "/receipt";
        } else {
            $data['receiptUrl'] = null;
        }
        return $data;
    }

    public function receipt(Request $request, int $id)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = Payment::where('tenant_id', $tenantId);
        // All users in the tenant can view receipts as per business requirements
        $payment = $query->findOrFail($id);

        if (!$payment->receipt_path) {
            abort(404);
        }

        $s3 = Storage::disk('s3_global');
        if (!$s3->exists($payment->receipt_path)) {
            abort(404);
        }

        return $s3->response($payment->receipt_path);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'ADMIN' && !$user->can('payments.delete')) {
            return response()->json(['message' => 'Tahsilat silme işlemi için yetkiniz bulunmamaktadır.'], 403);
        }

        $tenantId = $user->tenant_id;

        $query = Payment::where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN' && !$user->can('payments.view_all')) {
            $query->whereHas('job', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        $payment = $query->findOrFail($id);

        $payment->load('job');
        $jobTitle = $payment->job?->title ?? 'Genel';

        ActivityLogService::log($request->user(), 'DELETE', 'PAYMENT', $payment->id, $jobTitle,
            "{$jobTitle} işindeki {$payment->amount} TL'lik ödeme silindi.");

        if ($payment->receipt_path) {
            Storage::disk('s3_global')->delete($payment->receipt_path);
        }

        $payment->delete();

        return response()->json(['message' => 'Ödeme silindi.']);
    }
}
