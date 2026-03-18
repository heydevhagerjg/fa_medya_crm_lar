<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Tenant;
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

    private function setS3Config($tenant)
    {
        if (!$tenant->aws_access_key_id || !$tenant->aws_secret_access_key || !$tenant->aws_bucket_name) {
            return false;
        }

        $region = $tenant->aws_region ?? 'eu-central-1';

        Config::set('filesystems.disks.s3_tenant', [
            'driver' => 's3',
            'key'    => $tenant->aws_access_key_id,
            'secret' => $tenant->aws_secret_access_key,
            'region' => $region,
            'bucket' => $tenant->aws_bucket_name,
            'url'    => "https://{$tenant->aws_bucket_name}.s3.{$region}.amazonaws.com",
            'use_path_style_endpoint' => false,
            'throw'  => true,
        ]);

        return true;
    }

    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('payments');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            $user = $request->user();
            $tenantId = $user->tenant_id;

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

            return $query->get()->map(fn($p) => $this->paymentResource($p))->toArray();
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
            $tenant = Tenant::find($tenantId);
            $disk = $this->setS3Config($tenant) ? 's3_tenant' : 's3';
            $receiptPath = $request->file('receipt')->store('receipts/' . $tenantId, $disk);
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

        $this->clearTenantCache('payments');
        $this->clearTenantCache('jobs'); // Total paid amount changes

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
            $tenant = Tenant::find($tenantId);
            $disk = $this->setS3Config($tenant) ? 's3_tenant' : 's3';
            if ($receiptPath) {
                Storage::disk($disk)->delete($receiptPath);
            }
            $receiptPath = $request->file('receipt')->store('receipts/' . $tenantId, $disk);
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

        $this->clearTenantCache('payments');
        $this->clearTenantCache('jobs');

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
            $tenant = Tenant::find($data['tenant_id']);
            $disk = $this->setS3Config($tenant) ? 's3_tenant' : 's3';
            $data['receiptUrl'] = Storage::disk($disk)->temporaryUrl($data['receipt_path'], now()->addMinutes(60));
        } else {
            $data['receiptUrl'] = null;
        }
        return $data;
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
            $tenant = Tenant::find($tenantId);
            $disk = $this->setS3Config($tenant) ? 's3_tenant' : 's3';
            Storage::disk($disk)->delete($payment->receipt_path);
        }

        $payment->delete();
        $this->clearTenantCache('payments');
        $this->clearTenantCache('jobs');

        return response()->json(['message' => 'Ödeme silindi.']);
    }
}
