<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\CustomField;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $services = Service::where('tenant_id', $tenantId)
            ->with('customFields')
            ->orderBy('name')
            ->get();

        return response()->json($services->map(fn($s) => [
            'id'          => $s->id,
            'tenantId'    => $s->tenant_id,
            'name'        => $s->name,
            'config'      => $s->config,
            'customfield' => $s->customFields,
            'createdAt'   => $s->created_at,
            'updatedAt'   => $s->updated_at,
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'config'       => 'nullable|array',
            'customFields' => 'nullable|array',
            'customFields.*.label'    => 'required|string',
            'customFields.*.type'     => 'required|string',
            'customFields.*.required' => 'nullable|boolean',
            'customFields.*.order'    => 'nullable|integer',
        ]);

        $tenantId = $request->user()->tenant_id;

        $service = DB::transaction(function () use ($validated, $tenantId) {
            $service = Service::create([
                'tenant_id' => $tenantId,
                'name'      => $validated['name'],
                'config'    => $validated['config'] ?? ['showDetails' => true, 'showNotes' => true, 'showFiles' => true, 'showSteps' => true],
            ]);

            if (!empty($validated['customFields'])) {
                foreach ($validated['customFields'] as $field) {
                    $service->customFields()->create([
                        'label'    => $field['label'],
                        'type'     => $field['type'],
                        'required' => $field['required'] ?? false,
                        'order'    => $field['order'] ?? 0,
                    ]);
                }
            }

            return $service;
        });

        return response()->json($service->fresh()->load('customFields'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $service = Service::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'config'       => 'nullable|array',
            'customFields' => 'nullable|array',
        ]);

        DB::transaction(function () use ($service, $validated) {
            $service->update([
                'name'   => $validated['name'] ?? $service->name,
                'config' => $validated['config'] ?? $service->config,
            ]);

            if (isset($validated['customFields'])) {
                $service->customFields()->delete();
                foreach ($validated['customFields'] as $field) {
                    $service->customFields()->create([
                        'label'    => $field['label'],
                        'type'     => $field['type'] ?? 'text',
                        'required' => $field['required'] ?? false,
                        'order'    => $field['order'] ?? 0,
                    ]);
                }
            }
        });

        return response()->json($service->fresh()->load('customFields'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        Service::where('tenant_id', $tenantId)->findOrFail($id)->delete();
        return response()->json(['message' => 'Hizmet silindi.']);
    }
}
