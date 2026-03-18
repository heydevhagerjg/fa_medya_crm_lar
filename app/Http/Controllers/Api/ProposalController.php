<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Payment;
use App\Models\Proposal;
use App\Models\ProposalInstallment;
use App\Models\ProposalItem;
use App\Models\ProposalRevisionRequest;
use App\Services\ActivityLogService;
use App\Traits\HasTenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProposalController extends Controller
{
    use HasTenantCache;

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $proposals = Proposal::where('tenant_id', $tenantId)
            ->with(['customer', 'items', 'service', 'revisionRequests', 'installments'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($proposals);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id'         => 'required|exists:customers,id',
            'service_id'          => 'nullable|exists:services,id',
            'title'               => 'required|string|max:255',
            'description'         => 'nullable|string',
            'valid_until'         => 'nullable|date',
            'items'               => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity'    => 'required|numeric|min:1',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'installments'        => 'nullable|array',
            'installments.*.amount'       => 'required_with:installments|numeric|min:0',
            'installments.*.percentage'   => 'nullable|numeric|min:0',
            'installments.*.payment_date' => 'nullable|date',
            'installments.*.description'  => 'nullable|string',
            'installments.*.is_paid'      => 'nullable|boolean',
            'is_vat_included'     => 'nullable|boolean',
            'vat_rate'            => 'nullable|integer|min:0',
        ]);

        $tenantId = $request->user()->tenant_id;

        return DB::transaction(function () use ($validated, $tenantId, $request) {
            $proposal = Proposal::create([
                'tenant_id'       => $tenantId,
                'customer_id'     => $validated['customer_id'],
                'service_id'      => $validated['service_id'] ?? null,
                'title'           => $validated['title'],
                'description'     => $validated['description'] ?? null,
                'valid_until'     => $validated['valid_until'] ?? null,
                'status'          => 'DRAFT',
                'is_vat_included' => $validated['is_vat_included'] ?? false,
                'vat_rate'        => $validated['vat_rate'] ?? 0,
            ]);

            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemTotal;

                $proposal->items()->create([
                    'description' => $item['description'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total_price' => $itemTotal,
                ]);
            }

            $vatRate = $proposal->vat_rate;
            $vatAmount = $proposal->is_vat_included ? ($subtotal * $vatRate / 100) : 0;
            $totalPrice = $subtotal + $vatAmount;

            $proposal->update([
                'subtotal'    => $subtotal,
                'vat_amount'  => $vatAmount,
                'total_price' => $totalPrice
            ]);
            
            try {
                if (!empty($validated['installments'])) {
                    foreach ($validated['installments'] as $insData) {
                        $is_paid = filter_var($insData['is_paid'] ?? false, FILTER_VALIDATE_BOOLEAN);
                        $proposal->installments()->create([
                            'amount'       => (float) ($insData['amount'] ?? 0),
                            'percentage'   => (float) ($insData['percentage'] ?? 0),
                            'payment_date' => $insData['payment_date'] ?? null,
                            'description'  => $insData['description'] ?? '',
                            'is_paid'      => $is_paid,
                            'paid_at'      => $is_paid ? ($insData['paid_at'] ?? now()) : null,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Proposal store error (installments): " . $e->getMessage());
                throw $e;
            }

            ActivityLogService::log($request->user(), 'CREATE', 'PROPOSAL', $proposal->id, $proposal->title,
                "{$proposal->title} başlıklı teklif oluşturuldu.");

            return response()->json($proposal->load(['items', 'installments']), 201);
        });
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $proposal = Proposal::where('tenant_id', $tenantId)
            ->with(['customer', 'items', 'service', 'revisionRequests', 'installments'])
            ->findOrFail($id);

        return response()->json($proposal);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $proposal = Proposal::where('tenant_id', $tenantId)->with('job')->findOrFail($id);

        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'valid_until'         => 'nullable|date',
            'service_id'          => 'nullable|exists:services,id',
            'status'              => 'sometimes|in:DRAFT,SENT,ACCEPTED,REJECTED,REVISION_REQUESTED,CANCELLED,RENEWAL_REQUESTED',
            'items'               => 'sometimes|array',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity'    => 'required_with:items|numeric|min:1',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
            'installments'        => 'nullable|array',
            'installments.*.amount'       => 'required_with:installments|numeric|min:0',
            'installments.*.percentage'   => 'nullable|numeric|min:0',
            'installments.*.payment_date' => 'nullable|date',
            'installments.*.description'  => 'nullable|string',
            'installments.*.is_paid'      => 'nullable|boolean',
            'is_vat_included'     => 'nullable|boolean',
            'vat_rate'            => 'nullable|integer|min:0',
        ]);

        return DB::transaction(function () use ($validated, $proposal, $request, $tenantId) {
            $proposal->update($request->only(['title', 'description', 'valid_until', 'status', 'service_id', 'is_vat_included', 'vat_rate']));

            if ($request->has('items') || $request->has('is_vat_included') || $request->has('vat_rate')) {
                if ($request->has('items')) {
                    $proposal->items()->delete();
                    $subtotal = 0;
                    foreach ($validated['items'] as $item) {
                        $itemTotal = $item['quantity'] * $item['unit_price'];
                        $subtotal += $itemTotal;

                        $proposal->items()->create([
                            'description' => $item['description'],
                            'quantity'    => $item['quantity'],
                            'unit_price'  => $item['unit_price'],
                            'total_price' => $itemTotal,
                        ]);
                    }
                } else {
                    $subtotal = $proposal->subtotal;
                }
                
                $vatRate = $proposal->vat_rate;
                $vatAmount = $proposal->is_vat_included ? ($subtotal * $vatRate / 100) : 0;
                $totalPrice = $subtotal + $vatAmount;

                $proposal->update([
                    'subtotal'    => $subtotal,
                    'vat_amount'  => $vatAmount,
                    'total_price' => $totalPrice
                ]);

                if ($proposal->job) {
                    $proposal->job->update([
                        'is_vat_included' => $proposal->is_vat_included,
                        'vat_rate'        => $proposal->vat_rate,
                        'subtotal'        => $proposal->subtotal,
                        'vat_amount'      => $proposal->vat_amount,
                        'total_price'     => $proposal->total_price,
                    ]);
                }
            }

            try {
                if ($request->has('installments')) {
                    $job = $proposal->job;
                    // Delete old installments from both proposal and job to ensure a clean sync
                    $proposal->installments()->delete();
                    if ($job) {
                        $job->installments()->delete();
                    }

                    $installmentsData = (array) $request->input('installments', []);
                    foreach ($installmentsData as $insData) {
                        $is_paid = filter_var($insData['is_paid'] ?? false, FILTER_VALIDATE_BOOLEAN);
                        $proposal->installments()->create([
                            'job_id'       => $job ? $job->id : null,
                            'amount'       => (float) ($insData['amount'] ?? 0),
                            'percentage'   => (float) ($insData['percentage'] ?? 0),
                            'payment_date' => $insData['payment_date'] ?? null,
                            'description'  => $insData['description'] ?? '',
                            'is_paid'      => $is_paid,
                            'paid_at'      => $is_paid ? ($insData['paid_at'] ?? now()) : null,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Proposal update error (installments): " . $e->getMessage());
                throw $e;
            }

            ActivityLogService::log($request->user(), 'UPDATE', 'PROPOSAL', $proposal->id, $proposal->title,
                "{$proposal->title} başlıklı teklif güncellendi.");

            // Clear job cache to reflect changes in installments
            if ($proposal->job) {
                $this->clearTenantCache('jobs', $tenantId);
            }

            return response()->json($proposal->load(['items', 'installments']));
        });
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $proposal = Proposal::where('tenant_id', $tenantId)->findOrFail($id);

        ActivityLogService::log($request->user(), 'DELETE', 'PROPOSAL', $proposal->id, $proposal->title,
            "{$proposal->title} başlıklı teklif silindi.");

        $proposal->delete();

        return response()->json(['message' => 'Teklif silindi.']);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $proposal = Proposal::where('tenant_id', $tenantId)->findOrFail($id);

        $proposal->update([
            'status'  => 'SENT',
            'sent_at' => now(),
        ]);

        ActivityLogService::log($request->user(), 'UPDATE', 'PROPOSAL', $proposal->id, $proposal->title,
            "{$proposal->title} başlıklı teklif müşteriye gönderildi olarak işaretlendi.");

        return response()->json(['message' => 'Teklif gönderildi olarak işaretlendi.', 'proposal' => $proposal]);
    }

    public function recall(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $proposal = Proposal::where('tenant_id', $tenantId)->findOrFail($id);

        $proposal->update(['status' => 'DRAFT']);

        ActivityLogService::log($request->user(), 'UPDATE', 'PROPOSAL', $proposal->id, $proposal->title,
            "{$proposal->title} başlıklı teklif geri çekildi.");

        return response()->json(['message' => 'Teklif geri çekildi (Taslağa alındı).', 'proposal' => $proposal]);
    }

    public function respondToRevision(Request $request, int $proposalId, int $revisionId): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $proposal = Proposal::where('tenant_id', $tenantId)->findOrFail($proposalId);
        $revision = ProposalRevisionRequest::where('proposal_id', $proposalId)->findOrFail($revisionId);

        $validated = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED'
        ]);

        $revision->update(['status' => $validated['status']]);

        ActivityLogService::log($request->user(), 'UPDATE', 'PROPOSAL', $proposal->id, $proposal->title,
            "Revize talebi " . ($validated['status'] === 'APPROVED' ? 'onaylandı.' : 'reddedildi.'));

        return response()->json(['message' => 'Revize talebi yanıtlandı.', 'revision' => $revision]);
    }
    public function toggleInstallmentPaid(Request $request, int $id): JsonResponse
    {
        $installment = ProposalInstallment::with(['proposal', 'job'])->findOrFail($id);
        
        $tenantId = $request->user()->tenant_id;
        $isAuthorized = false;

        if ($installment->proposal && $installment->proposal->tenant_id === $tenantId) {
            $isAuthorized = true;
        } elseif ($installment->job && $installment->job->tenant_id === $tenantId) {
            $isAuthorized = true;
        }

        if (!$isAuthorized) {
            return response()->json(['message' => 'Yetkisiz erişim.'], 403);
        }

        $nowPaid = !$installment->is_paid;

        DB::transaction(function () use ($installment, $nowPaid, $tenantId, $request) {
            $installment->update([
                'is_paid' => $nowPaid,
                'paid_at' => $nowPaid ? now() : null,
            ]);

            if ($nowPaid && $installment->job_id) {
                // Determine if this is the last installment in the schedule
                $isLast = !ProposalInstallment::where('job_id', $installment->job_id)
                    ->where(function($q) use ($installment) {
                        $q->where('payment_date', '>', $installment->payment_date)
                          ->orWhere(function($sub) use ($installment) {
                              $sub->where('payment_date', $installment->payment_date)
                                  ->where('id', '>', $installment->id);
                          });
                    })
                    ->exists();

                $type = 'PARTIAL';
                if (stripos($installment->description, 'avans') !== false) {
                    $type = 'ADVANCE';
                } elseif ($isLast) {
                    $type = 'FINAL';
                }

                // Find default cash register for tenant
                $defaultCash = CashRegister::where('tenant_id', $tenantId)->where('is_default', true)->first();

                // Create actual payment record
                Payment::create([
                    'tenant_id'        => $tenantId,
                    'job_id'           => $installment->job_id,
                    'amount'           => $installment->amount,
                    'payment_date'     => now(),
                    'payment_type'     => $type,
                    'description'      => $installment->description ?: "Taksit ödemesi (" . $installment->amount . " TL)",
                    'cash_register_id' => $defaultCash ? $defaultCash->id : null,
                ]);

                $this->clearTenantCache('payments', $tenantId);
                $this->clearTenantCache('jobs', $tenantId);
            }
        });

        return response()->json([
            'message' => $installment->is_paid ? 'Ödeme ödendi olarak işaretlendi ve tahsilatlara eklendi.' : 'Ödeme bekliyor olarak işaretlendi.',
            'installment' => $installment->fresh()
        ]);
    }
}
