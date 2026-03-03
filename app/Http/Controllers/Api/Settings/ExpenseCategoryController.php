<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        return response()->json(ExpenseCategory::where('tenant_id', $tenantId)->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $category = ExpenseCategory::create(array_merge($validated, ['tenant_id' => $request->user()->tenant_id]));
        return response()->json($category, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = ExpenseCategory::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $category->update($request->validate(['name' => 'required|string|max:255']));
        return response()->json($category);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ExpenseCategory::where('tenant_id', $request->user()->tenant_id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Kategori silindi.']);
    }
}
