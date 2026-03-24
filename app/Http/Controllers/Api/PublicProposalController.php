<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proposal;
use App\Models\JobCrm;
use App\Models\JobDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ActivityLog;
use App\Models\ProposalRevisionRequest;
use App\Models\JobStatus;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Cache;

class PublicProposalController extends Controller
{
    use \App\Traits\HasTenantCache;
    public function show(string $uuid): JsonResponse
    {
        $proposal = Proposal::where('uuid', $uuid)
            ->with(['customer', 'items', 'tenant', 'installments'])
            ->firstOrFail();

        if (!$proposal->tenant || !$proposal->tenant->is_active) {
            return response()->json(['message' => 'Bu firmanın hesabı şu anda pasif durumdadır.'], 403);
        }


        // Fetch history logs
        $logs = ActivityLog::where('entity_type', 'PROPOSAL')
            ->where('entity_id', $proposal->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'proposal' => $proposal,
            'history' => $logs->map(fn($log) => [
                'action' => $log->action,
                'details' => $log->details,
                'created_at' => $log->created_at,
                'is_customer' => $log->user_id === null,
            ]),
            'can_respond' => in_array($proposal->status, ['SENT', 'DRAFT']) && ($proposal->valid_until ? $proposal->valid_until->isFuture() || $proposal->valid_until->isToday() : true),
            'message' => ($proposal->valid_until && $proposal->valid_until->isPast()) ? 'Bu teklifin geçerlilik süresi dolmuştur.' : ($proposal->status === 'REVISION_REQUESTED' ? 'Revize talebiniz iletildi. Teklif güncellendiğinde tekrar bilgilendirileceksiniz.' : null)
        ]);
    }

    public function respond(Request $request, string $uuid): JsonResponse
    {
        $proposal = Proposal::where('uuid', $uuid)->with('tenant')->firstOrFail();

        if (!$proposal->tenant || !$proposal->tenant->is_active) {
            return response()->json(['message' => 'Bu firmanın hesabı şu anda pasif durumdadır.'], 403);
        }


        if (!in_array($proposal->status, ['SENT', 'DRAFT'])) {
            return response()->json(['message' => 'Bu teklif şu anki durumuyla yanıtlanamaz.'], 400);
        }

        $validated = $request->validate([
            'action' => 'required|in:ACCEPT,REJECT,REVISE,RENEWAL_REQUEST',
            'customer_notes' => 'nullable|string|max:1000',
        ]);

        if ($validated['action'] !== 'RENEWAL_REQUEST' && $proposal->valid_until && $proposal->valid_until->isPast()) {
            return response()->json(['message' => 'Bu teklifin geçerlilik süresi dolmuştur.'], 400);
        }

        return DB::transaction(function () use ($validated, $proposal) {
            switch ($validated['action']) {
                case 'ACCEPT':
                    $proposal->update(['status' => 'ACCEPTED']);
                    $this->createJobFromProposal($proposal);
                    $message = 'Teklif kabul edildi. İşlemleriniz başlatıldı.';
                    $logDetails = "Müşteri teklifi kabul etti.";
                    break;

                case 'REJECT':
                    $proposal->update(['status' => 'REJECTED', 'customer_notes' => $validated['customer_notes'] ?? null]);
                    $message = 'Teklif reddedildi.';
                    $logDetails = "Müşteri teklifi reddetti. Not: " . ($validated['customer_notes'] ?? '-');
                    break;

                case 'REVISE':
                    $proposal->update(['status' => 'REVISION_REQUESTED', 'customer_notes' => $validated['customer_notes'] ?? null]);
                    ProposalRevisionRequest::create([
                        'proposal_id' => $proposal->id,
                        'notes' => $validated['customer_notes'] ?? null,
                        'status' => 'PENDING'
                    ]);
                    $message = 'Revize talebiniz iletildi. Teklif güncellendiğinde tekrar bilgilendirileceksiniz.';
                    $logDetails = "Müşteri revize istedi. Not: " . ($validated['customer_notes'] ?? '-');
                    break;

                case 'RENEWAL_REQUEST':
                    $proposal->update(['status' => 'RENEWAL_REQUESTED', 'customer_notes' => 'Süresi dolan teklif için yenileme talebi iletildi.']);
                    ProposalRevisionRequest::create([
                        'proposal_id' => $proposal->id,
                        'notes' => 'Bu teklifin süresi dolmuş. Müşteri teklifin yenilenmesini talep ediyor.',
                        'status' => 'PENDING'
                    ]);
                    $message = 'Teklif yenileme talebiniz firmaya iletildi.';
                    $logDetails = "Müşteri süresi dolan teklif için yenileme talep etti.";
                    break;
            }

            ActivityLogService::log(null, 'UPDATE', 'PROPOSAL', $proposal->id, $proposal->title, $logDetails, $proposal->tenant_id);

            return response()->json(['message' => $message, 'status' => $proposal->status]);
        });
    }

    public function downloadPdf(string $uuid)
    {
        $proposal = Proposal::where('uuid', $uuid)
            ->with(['customer', 'items', 'tenant', 'installments'])
            ->firstOrFail();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.proposal', compact('proposal'));
        
        $filename = "Teklif-" . \Illuminate\Support\Str::slug($proposal->customer->name) . "-" . $proposal->id . ".pdf";
        
        return $pdf->download($filename);
    }

    protected function createJobFromProposal(Proposal $proposal)
    {
        $tenantId = $proposal->tenant_id;

        // Fetch first status for tenant
        $ds = JobStatus::where('tenant_id', $tenantId)->orderBy('order')->first();
        if (!$ds) {
            $ds = JobStatus::create([
                'tenant_id' => $tenantId,
                'name'      => 'Varsayılan',
                'color'     => '#6366f1',
                'order'     => 0,
            ]);
        }

        $job = JobCrm::create([
            'tenant_id'     => $tenantId,
            'customer_id'   => $proposal->customer_id,
            'proposal_id'   => $proposal->id,
            'service_id'    => $proposal->service_id,
            'job_status_id' => $ds->id,
            'title'         => $proposal->title,
            'description'   => $proposal->description,
            'status'        => 'PENDING',
            'start_date'    => now(),
            'total_price'   => $proposal->total_price,
            'is_vat_included' => $proposal->is_vat_included,
            'vat_rate'        => $proposal->vat_rate,
            'subtotal'        => $proposal->subtotal,
            'vat_amount'      => $proposal->vat_amount,
        ]);

        JobDetail::create([
            'job_id'            => $job->id,
            'notes'             => "Tekliften otomatik oluşturuldu. (Teklif ID: {$proposal->id})",
            'customer_requests' => $proposal->customer_notes,
        ]);

        // Link installments to the job
        if ($proposal->installments->isNotEmpty()) {
            foreach ($proposal->installments as $ins) {
                $ins->update(['job_id' => $job->id]);
            }
        }

        ActivityLogService::log(null, 'CREATE', 'JOB', $job->id, $job->title,
            "{$proposal->title} teklifinden iş oluşturuldu.", $tenantId);

        return $job;
    }
}
