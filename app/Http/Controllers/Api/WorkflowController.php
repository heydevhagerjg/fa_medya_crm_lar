<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkflowController extends Controller
{
    /**
     * Tenant'a ait tüm otomasyonları listeler.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $workflows = Workflow::where('tenant_id', $tenantId)
            ->with(['conditions', 'actions'])
            ->get();

        return response()->json($workflows);
    }

    /**
     * Yeni bir otomasyon oluşturur.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'trigger_model'  => 'required|string',
            'trigger_event'  => 'required|string',
            'is_active'      => 'boolean',
            'conditions'     => 'nullable|array',
            'conditions.*.field'    => 'required|string',
            'conditions.*.operator' => 'required|string',
            'conditions.*.value'    => 'nullable|string',
            'actions'        => 'required|array|min:1',
            'actions.*.type'       => 'required|string',
            'actions.*.parameters' => 'required|array',
        ]);

        $tenantId = $request->user()->tenant_id;

        return DB::transaction(function () use ($validated, $tenantId) {
            $workflow = Workflow::create([
                'tenant_id'     => $tenantId,
                'name'          => $validated['name'],
                'trigger_model' => $validated['trigger_model'],
                'trigger_event' => $validated['trigger_event'],
                'is_active'     => $validated['is_active'] ?? true,
            ]);

            if (!empty($validated['conditions'])) {
                foreach ($validated['conditions'] as $condition) {
                    $workflow->conditions()->create($condition);
                }
            }

            foreach ($validated['actions'] as $action) {
                $workflow->actions()->create($action);
            }

            return response()->json($workflow->load(['conditions', 'actions']), 201);
        });
    }

    /**
     * Otomasyon detayını getirir.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $workflow = Workflow::where('tenant_id', $tenantId)
            ->with(['conditions', 'actions'])
            ->findOrFail($id);

        return response()->json($workflow);
    }

    /**
     * Otomasyonu günceller.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $workflow = Workflow::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'trigger_model'  => 'sometimes|string',
            'trigger_event'  => 'sometimes|string',
            'is_active'      => 'boolean',
            'conditions'     => 'nullable|array',
            'actions'        => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated, $workflow) {
            $workflow->update($validated);

            if (isset($validated['conditions'])) {
                $workflow->conditions()->delete();
                foreach ($validated['conditions'] as $condition) {
                    $workflow->conditions()->create($condition);
                }
            }

            if (isset($validated['actions'])) {
                $workflow->actions()->delete();
                foreach ($validated['actions'] as $action) {
                    $workflow->actions()->create($action);
                }
            }

            return response()->json($workflow->load(['conditions', 'actions']));
        });
    }

    /**
     * Otomasyonu siler.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $workflow = Workflow::where('tenant_id', $tenantId)->findOrFail($id);
        
        $workflow->delete();

        return response()->json(['message' => 'Otomasyon silindi.']);
    }

    /**
     * Otomasyonu aktif/pasif yapar.
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $workflow = Workflow::where('tenant_id', $tenantId)->findOrFail($id);
        
        $workflow->is_active = !$workflow->is_active;
        $workflow->save();

        return response()->json([
            'message' => $workflow->is_active ? 'Otomasyon aktif edildi.' : 'Otomasyon pasifleştirildi.',
            'is_active' => $workflow->is_active
        ]);
    }

    /**
     * Otomasyon çalışma kayıtlarını getirir.
     */
    public function logs(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $logs = \App\Models\WorkflowLog::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($logs);
    }
}
