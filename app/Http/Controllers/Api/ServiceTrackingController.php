<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceTracking;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ServiceTrackingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $status = $request->query('status', 'active');

        $query = ServiceTracking::with(['category', 'customer'])
            ->where('tenant_id', $tenantId)
            ->orderBy('next_date');

        if ($status === 'all') {
            $query->withoutGlobalScope('active');
        } elseif ($status === 'cancelled') {
            $query->withoutGlobalScope('active')->where('status', 'cancelled');
        }

        $trackings = $query->get();
            
        return response()->json($trackings->map(function($t) {
            $data = $t->toArray();
            $data['missed_dates'] = $t->getMissedDates();
            return $data;
        }));
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $tracking = ServiceTracking::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $plannedDate = $request->input('planned_date', $tracking->next_date);
        $status = $request->input('status', 'completed'); // 'completed' or 'skipped'

        // Record log (Prevent duplicates for the same date)
        \App\Models\ServiceTrackingLog::updateOrCreate(
            [
                'tenant_id' => $request->user()->tenant_id,
                'service_tracking_id' => $tracking->id,
                'planned_date' => $plannedDate,
            ],
            [
                'completed_at' => now(),
                'status' => $status,
                'notes' => $request->input('notes')
            ]
        );

        // Move next_date to the next occurrence after this planned date
        $nextDate = $this->calculateNextDate($plannedDate, $tracking->period, $tracking->period_unit);
        $tracking->update(['next_date' => $nextDate]);

        $statusLabel = $status === 'completed' ? 'tamamlandı' : 'yapılmadı (atlandı)';
        ActivityLogService::log($request->user(), strtoupper($status), 'SERVICE_TRACKING', $tracking->id, $tracking->title,
            "{$tracking->title} için {$plannedDate} tarihli hizmet {$statusLabel}.");

        return response()->json(['message' => 'İşlem kaydedildi.', 'next_date' => $nextDate]);
    }

    public function catchUp(Request $request, int $id): JsonResponse
    {
        $tracking = ServiceTracking::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $missedDates = $tracking->getMissedDates();

        foreach ($missedDates as $date) {
            \App\Models\ServiceTrackingLog::updateOrCreate(
                [
                    'tenant_id' => $request->user()->tenant_id,
                    'service_tracking_id' => $tracking->id,
                    'planned_date' => $date,
                ],
                [
                    'completed_at' => now(),
                    'status' => 'skipped',
                    'notes' => 'Güncele getirme işlemi ile atlandı.'
                ]
            );
        }

        // Calculate next future date
        $current = Carbon::parse($tracking->next_date);
        $today = now()->startOfDay();
        while ($current->lt($today)) {
            $current = $this->addPeriod($current, $tracking->period, $tracking->period_unit);
        }
        
        $tracking->update(['next_date' => $current->toDateString()]);

        ActivityLogService::log($request->user(), 'CATCHUP', 'SERVICE_TRACKING', $tracking->id, $tracking->title,
            "{$tracking->title} için gecikmiş hizmetler atlanarak güncele getirildi.");

        return response()->json(['message' => 'Takipler güncele getirildi.', 'next_date' => $current->toDateString()]);
    }

    private function addPeriod($date, $period, $unit)
    {
        $d = clone $date;
        $period = (int) $period;
        switch ($unit) {
            case 'day': return $d->addDays($period);
            case 'week': return $d->addWeeks($period);
            case 'month': return $d->addMonths($period);
            case 'year': return $d->addYears($period);
        }
        return $d;
    }


    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:service_tracking_categories,id',
            'customer_id' => 'nullable|exists:customers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'period' => 'required|integer|min:1',
            'period_unit' => 'required|in:day,week,month,year',
            'start_date' => 'required|date',
        ]);

        $nextDate = $this->calculateNextDate($validated['start_date'], $validated['period'], $validated['period_unit']);

        $tracking = ServiceTracking::create(array_merge($validated, [
            'tenant_id' => $request->user()->tenant_id,
            'next_date' => $nextDate
        ]));

        ActivityLogService::log($request->user(), 'CREATE', 'SERVICE_TRACKING', $tracking->id, $tracking->title,
            "{$tracking->title} isimli hizmet takibi oluşturuldu.");

        return response()->json($tracking->load(['category', 'customer']), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tracking = ServiceTracking::with(['category', 'customer', 'logs' => function($q) {
                $q->orderByDesc('planned_date')->orderByDesc('created_at');
            }])
            ->where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);
        return response()->json($tracking);
    }

    public function logs(Request $request, int $id): JsonResponse
    {
        $logs = \App\Models\ServiceTrackingLog::where('service_tracking_id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->orderByDesc('planned_date')
            ->orderByDesc('created_at')
            ->get();
        return response()->json($logs);
    }

    public function updateLogStatus(Request $request, int $logId): JsonResponse
    {
        $log = \App\Models\ServiceTrackingLog::where('tenant_id', $request->user()->tenant_id)->findOrFail($logId);
        
        $tracking = \App\Models\ServiceTracking::withoutGlobalScope('active')
            ->where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($log->service_tracking_id);

        if ($tracking->status === 'cancelled') {
            return response()->json(['message' => 'İptal edilmiş takiplerin geçmişi değiştirilemez.'], 422);
        }

        $status = $request->input('status');

        if (!in_array($status, ['completed', 'skipped'])) {
            return response()->json(['message' => 'Geçersiz durum.'], 422);
        }

        $log->update(['status' => $status]);

        ActivityLogService::log($request->user(), 'UPDATE_LOG', 'SERVICE_TRACKING_LOG', $log->id, $log->planned_date,
            "{$log->planned_date} tarihli hizmet kaydı durumu {$status} olarak güncellendi.");

        return response()->json(['message' => 'Hizmet kaydı güncellendi.', 'log' => $log]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tracking = ServiceTracking::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'required|exists:service_tracking_categories,id',
            'customer_id' => 'nullable|exists:customers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'period' => 'required|integer|min:1',
            'period_unit' => 'required|in:day,week,month,year',
            'start_date' => 'required|date',
        ]);

        $nextDate = $this->calculateNextDate($validated['start_date'], $validated['period'], $validated['period_unit']);

        $tracking->update(array_merge($validated, [
            'next_date' => $nextDate
        ]));

        ActivityLogService::log($request->user(), 'UPDATE', 'SERVICE_TRACKING', $tracking->id, $tracking->title,
            "{$tracking->title} isimli hizmet takibi güncellendi.");

        return response()->json($tracking->load(['category', 'customer']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tracking = ServiceTracking::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'SERVICE_TRACKING', $tracking->id, $tracking->title,
            "{$tracking->title} isimli hizmet takibi silindi.");

        $tracking->delete();
        return response()->json(['message' => 'Hizmet takibi silindi.']);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $tracking = ServiceTracking::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);

        $tracking->update(['status' => 'cancelled']);

        ActivityLogService::log($request->user(), 'CANCEL', 'SERVICE_TRACKING', $tracking->id, $tracking->title,
            "{$tracking->title} isimli hizmet takibi iptal edildi.");

        return response()->json(['message' => 'Hizmet takibi iptal edildi.']);
    }

    public function activate(Request $request, int $id): JsonResponse
    {
        $tracking = ServiceTracking::withoutGlobalScope('active')
            ->where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        $tracking->update(['status' => 'active']);

        ActivityLogService::log($request->user(), 'ACTIVATE', 'SERVICE_TRACKING', $tracking->id, $tracking->title,
            "{$tracking->title} isimli hizmet takibi tekrar aktifleştirildi.");

        return response()->json(['message' => 'Hizmet takibi tekrar aktifleştirildi.', 'tracking' => $tracking]);
    }

    private function calculateNextDate($startDate, $period, $unit)
    {
        $date = Carbon::parse($startDate);
        $period = (int) $period;
        switch ($unit) {
            case 'day': return $date->addDays($period);
            case 'week': return $date->addWeeks($period);
            case 'month': return $date->addMonths($period);
            case 'year': return $date->addYears($period);
            default: return $date;
        }
    }
}
