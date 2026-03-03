<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $query = Expense::where('tenant_id', $tenantId)
            ->with(['job', 'category', 'cashRegister'])
            ->orderByDesc('date');

        if ($request->has('jobId')) {
            $query->where('job_id', $request->jobId);
        }

        return response()->json($query->get());
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
            'cashRegisterId' => 'nullable|integer',
        ]);

        $tenantId = $request->user()->tenant_id;

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

        ActivityLogService::log($request->user(), 'CREATE', 'EXPENSE', $expense->id, $expense->title,
            "{$expense->amount} TL tutarında {$expense->title} masrafı eklendi.");

        return response()->json($expense->fresh()->load(['job', 'category', 'cashRegister']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $expense = Expense::where('tenant_id', $tenantId)->findOrFail($id);

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

        ActivityLogService::log($request->user(), 'UPDATE', 'EXPENSE', $expense->id, $expense->title,
            "{$expense->title} masrafı güncellendi.");

        return response()->json($expense->fresh()->load(['job', 'category', 'cashRegister']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $expense = Expense::where('tenant_id', $tenantId)->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'EXPENSE', $expense->id, $expense->title,
            "{$expense->amount} TL tutarındaki {$expense->title} masrafı silindi.");

        $expense->delete();

        return response()->json(['message' => 'Masraf silindi.']);
    }
}
