<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\StepTemplate;
use App\Models\DefaultStep;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StepTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $templates = StepTemplate::where('tenant_id', $tenantId)
            ->with('defaultSteps')
            ->get();
        return response()->json($templates->map(fn($t) => [
            'id'          => $t->id,
            'tenantId'    => $t->tenant_id,
            'name'        => $t->name,
            'defaultstep' => $t->defaultSteps,
            'createdAt'   => $t->created_at,
            'updatedAt'   => $t->updated_at,
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'steps' => 'nullable|array',
            'steps.*' => 'string',
        ]);

        $tenantId = $request->user()->tenant_id;

        $template = DB::transaction(function () use ($validated, $tenantId) {
            $template = StepTemplate::create(['tenant_id' => $tenantId, 'name' => $validated['name']]);
            if (!empty($validated['steps'])) {
                foreach ($validated['steps'] as $i => $title) {
                    $template->defaultSteps()->create(['title' => $title, 'order' => $i, 'tenant_id' => $tenantId]);
                }
            }
            return $template;
        });

        return response()->json($template->fresh()->load('defaultSteps'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $template = StepTemplate::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'steps' => 'nullable|array',
        ]);

        DB::transaction(function () use ($template, $validated, $tenantId) {
            if (isset($validated['name'])) $template->update(['name' => $validated['name']]);
            if (isset($validated['steps'])) {
                $template->defaultSteps()->delete();
                foreach ($validated['steps'] as $i => $title) {
                    $template->defaultSteps()->create(['title' => $title, 'order' => $i, 'tenant_id' => $tenantId]);
                }
            }
        });

        return response()->json($template->fresh()->load('defaultSteps'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        StepTemplate::where('tenant_id', $request->user()->tenant_id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Şablon silindi.']);
    }
}
