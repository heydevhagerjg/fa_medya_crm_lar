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

    private function setGlobalS3Config()
    {
        if (self::$globalS3Disk !== null) {
            return true;
        }

        $tenant = request()->user()->tenant ?? null;
        if (!$tenant || !$tenant->s3Config || !$tenant->s3Config->is_active) {
            return false;
        }
        $config = $tenant->s3Config;

        if (!$config->aws_access_key_id || !$config->aws_secret_access_key || !$config->aws_bucket_name) {
            return false;
        }

        $region = strtolower(trim($config->aws_region ?? 'eu-central-1'));

        \Illuminate\Support\Facades\Storage::forgetDisk('s3_global');

        \Illuminate\Support\Facades\Config::set('filesystems.disks.s3_global', [
            'driver' => 's3',
            'key'    => trim($config->aws_access_key_id),
            'secret' => trim($config->aws_secret_access_key),
            'region' => $region,
            'bucket' => trim($config->aws_bucket_name),
            'use_path_style_endpoint' => false,
            'url_encode_filenames' => true,
            'throw'  => true,
            'version' => 'latest'
        ]);

        self::$globalS3Disk = 's3_global';
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
            if (!$this->setGlobalS3Config()) {
                return response()->json(['message' => 'Yöneticisin depolama ayarlarını kontrol etmeli (S3 Yapılandırılmamış).'], 400);
            }
            $receiptPath = $request->file('receipt')->store('tenants/' . $tenantId . '/receipts', 's3_global');
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
            if (!$this->setGlobalS3Config()) {
                return response()->json(['message' => 'Yöneticisin depolama ayarlarını kontrol etmeli (S3 Yapılandırılmamış).'], 400);
            }
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

        if (!$this->setGlobalS3Config()) {
            abort(400, 'S3 Configuration missing');
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
            if ($this->setGlobalS3Config()) {
                Storage::disk('s3_global')->delete($payment->receipt_path);
            }
        }

        $payment->delete();
        $this->clearTenantCache('payments');
        $this->clearTenantCache('jobs');

        return response()->json(['message' => 'Ödeme silindi.']);
    }
}
