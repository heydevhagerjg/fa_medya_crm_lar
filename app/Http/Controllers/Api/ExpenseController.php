<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ExpenseController extends Controller
{
    use HasTenantCache;

    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->getTenantCacheKey('expenses');

        $data = Cache::remember($cacheKey, $this->getCacheTTL(), function () use ($request) {
            $user = $request->user();
            $tenantId = $user->tenant_id;

            $query = Expense::where('tenant_id', $tenantId)
                ->with(['job', 'category', 'cashRegister'])
                ->orderByDesc('date');

            if ($user->role !== 'ADMIN' && !$user->can('expenses.view_all')) {
                $query->whereHas('job', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }

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
            'title'          => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0',
            'date'           => 'required|date',
            'description'    => 'nullable|string',
            'jobId'          => 'nullable|integer',
            'categoryId'     => 'nullable|integer',
            'cashRegisterId' => 'nullable|integer'
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;

        // Verify job ownership if specified
        if (!empty($validated['jobId']) && $user->role !== 'ADMIN') {
            $jobQuery = \App\Models\JobCrm::where('tenant_id', $tenantId);
            if (!$user->can('expenses.view_all')) {
                $jobQuery->where('user_id', $user->id);
            }
            $jobQuery->findOrFail($validated['jobId']);
        } elseif (empty($validated['jobId']) && $user->role !== 'ADMIN') {
            if (!$user->can('expenses.view_all')) {
                return response()->json(['message' => 'Genel gider girişi yetkiniz bulunmamaktadır.'], 403);
            }
        }

        $expense = Expense::create([
            'tenant_id'        => $tenantId,
            'job_id'           => $validated['jobId'] ?? null,
            'category_id'      => $validated['categoryId'] ?? null,
            'title'            => $validated['title'],
            'amount'           => $validated['amount'],
            'date'             => $validated['date'],
            'description'      => $validated['description'] ?? null,
            'cash_register_id' => $validated['cashRegisterId'] ?? null,
        ]);

        $this->clearTenantCache('expenses');
        $this->clearTenantCache('jobs'); // Expenses affect job profit

        ActivityLogService::log($request->user(), 'CREATE', 'EXPENSE', $expense->id, $expense->title,
            "{$expense->amount} TL tutarında {$expense->title} masrafı eklendi.");

        return response()->json($expense->fresh()->load(['job', 'category', 'cashRegister']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'ADMIN' && !$user->can('expenses.edit')) {
            return response()->json(['message' => 'Gider/Masraf düzeltme işlemi için yetkiniz bulunmamaktadır.'], 403);
        }
        $tenantId = $user->tenant_id;

        $query = Expense::where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN' && !$user->can('expenses.view_all')) {
            $query->whereHas('job', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        $expense = $query->findOrFail($id);

        $validated = $request->validate([
            'title'          => 'sometimes|string|max:255',
            'amount'         => 'sometimes|numeric|min:0',
            'date'           => 'sometimes|date',
            'description'    => 'nullable|string',
            'jobId'          => 'nullable|integer',
            'categoryId'     => 'nullable|integer',
            'cashRegisterId' => 'nullable|integer',
        ]);

        $expense->update([
            'title'            => $validated['title'] ?? $expense->title,
            'amount'           => $validated['amount'] ?? $expense->amount,
            'date'             => $validated['date'] ?? $expense->date,
            'description'      => $validated['description'] ?? $expense->description,
            'job_id'           => array_key_exists('jobId', $validated) ? $validated['jobId'] : $expense->job_id,
            'category_id'      => array_key_exists('categoryId', $validated) ? $validated['categoryId'] : $expense->category_id,
            'cash_register_id' => array_key_exists('cashRegisterId', $validated) ? $validated['cashRegisterId'] : $expense->cash_register_id,
        ]);

        $this->clearTenantCache('expenses');
        $this->clearTenantCache('jobs');

        ActivityLogService::log($request->user(), 'UPDATE', 'EXPENSE', $expense->id, $expense->title,
            "{$expense->title} masrafı güncellendi.");

        return response()->json($expense->fresh()->load(['job', 'category', 'cashRegister']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'ADMIN' && !$user->can('expenses.delete')) {
            return response()->json(['message' => 'Gider/Masraf silme işlemi için yetkiniz bulunmamaktadır.'], 403);
        }
        $tenantId = $user->tenant_id;

        $query = Expense::where('tenant_id', $tenantId);
        if ($user->role !== 'ADMIN' && !$user->can('expenses.view_all')) {
            $query->whereHas('job', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        $expense = $query->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'EXPENSE', $expense->id, $expense->title,
            "{$expense->amount} TL tutarındaki {$expense->title} masrafı silindi.");

        $expense->delete();
        $this->clearTenantCache('expenses');
        $this->clearTenantCache('jobs');

        return response()->json(['message' => 'Masraf silindi.']);
    }
}
