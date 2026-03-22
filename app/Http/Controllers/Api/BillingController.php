<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Paddle\Subscription;

class BillingController extends Controller
{
    public function subscription(Request $request)
    {
        $tenant = $request->user()->tenant;
        $subscription = $tenant->subscription();

        $nextBilledAt = null;
        if ($subscription && $subscription->active()) {
            try {
                $paddleSub = $subscription->asPaddleSubscription();
                $nextBilledAt = $paddleSub->nextBilledAt ? $paddleSub->nextBilledAt->format('Y-m-d H:i:s') : null;

                // If nextBilledAt is null, it might be in scheduled_change or billing cycle
                if (!$nextBilledAt) {
                    if (!empty($paddleSub->scheduledChange)) {
                        $nextBilledAt = $paddleSub->scheduledChange['effective_at'] ?? null;
                    }
                    elseif (!empty($paddleSub->billingCycle)) {
                        $nextBilledAt = $paddleSub->billingCycle['next_step_at'] ?? null;
                    }
                    elseif (!empty($paddleSub->currentBillingPeriod)) {
                        $nextBilledAt = $paddleSub->currentBillingPeriod['ends_at'] ?? null;
                    }
                }
            }
            catch (\Exception $e) {
            // If API fails, log it or ignore
            }
        }

        return response()->json([
            'is_on_trial' => $tenant->onTrial(),
            'is_gifted' => $tenant->is_gifted,
            'is_free' => $tenant->package ? $tenant->package->isFree() : false,
            'trial_ends_at' => $tenant->trialEndsAt() ? $tenant->trialEndsAt()->toIso8601String() : null,
            'is_subscribed' => $tenant->subscribed(),
            'subscription' => $subscription ? array_merge($subscription->toArray(), ['next_billed_at' => $nextBilledAt]) : null,
            'package' => $tenant->package,
            'receipts' => $tenant->transactions()->latest()->get(),
            'all_packages' => \App\Models\Package::where('is_active', true)->get(),
            'usage' => [
                'personnel' => ['label' => 'Personel', 'limit' => $tenant->plan_personnel_limit, 'used' => $tenant->getResourceCount('personnel')],
                'customer' => ['label' => 'Müşteri', 'limit' => $tenant->plan_customer_limit, 'used' => $tenant->getResourceCount('customer')],
                'job' => ['label' => 'İş Takibi', 'limit' => $tenant->plan_job_limit, 'used' => $tenant->getResourceCount('job')],
                'appointment' => ['label' => 'Randevu', 'limit' => $tenant->plan_appointment_limit, 'used' => $tenant->getResourceCount('appointment')],
                'service_tracking' => ['label' => 'Hizmet Takibi', 'limit' => $tenant->plan_service_tracking_limit, 'used' => $tenant->getResourceCount('service_tracking')],
                'service' => ['label' => 'Tanımlı Hizmetler', 'limit' => $tenant->plan_service_limit, 'used' => $tenant->getResourceCount('service')],
                'step_template' => ['label' => 'Adım Şablonları', 'limit' => $tenant->plan_step_template_limit, 'used' => $tenant->getResourceCount('step_template')],
                'cash_register' => ['label' => 'Kasa', 'limit' => $tenant->plan_cash_register_limit, 'used' => $tenant->getResourceCount('cash_register')],
                'proposal' => ['label' => 'Teklif', 'limit' => $tenant->plan_proposal_limit, 'used' => $tenant->getResourceCount('proposal')],
                'disk_usage' => ['label' => 'Disk Kullanımı (MB)', 'limit' => $tenant->plan_disk_usage_limit . ' MB', 'used' => round(($tenant->storage_used ?? 0) / (1024 * 1024), 2) . ' MB'],
            ]
        ]);
    }

    public function swap(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:packages,id'
        ]);

        $tenant = $request->user()->tenant;
        $package = \App\Models\Package::findOrFail($request->package_id);

        // If switching to a free package
        if ($package->isFree()) {
            try {
                // If there is an active subscription, cancel it
                if ($tenant->subscribed()) {
                    $tenant->subscription()->cancel();
                }

                $tenant->applyPackage($package);
                return response()->json(['message' => 'Ücretsiz pakete başarıyla geçildi. Mevcut ücretli aboneliğiniz varsa dönem sonunda sona erecektir.']);
            }
            catch (\Exception $e) {
                return response()->json(['message' => 'Hata: ' . $e->getMessage()], 500);
            }
        }

        if (!$package->paddle_price_id) {
            return response()->json(['message' => 'Bu paket için ödeme bilgisi tanımlanmamış.'], 400);
        }

        if (!$tenant->subscribed()) {
            return response()->json(['message' => 'Aktif bir aboneliğiniz bulunmuyor.'], 400);
        }

        try {
            $tenant->subscription()->swap($package->paddle_price_id);

            // Limitleri anında güncellemek için
            $tenant->applyPackage($package);

            return response()->json(['message' => 'Paketiniz başarıyla değiştirildi. Yeni limitleriniz anında tanımlandı.']);
        }
        catch (\Exception $e) {
            if (str_contains(strtolower($e->getMessage()), 'pending scheduled changes')) {
                return response()->json(['message' => 'Abonelik üzerinde bekleyen bir işlem olduğu için şu an değiştirilemiyor.'], 422);
            }
            return response()->json(['message' => 'Hata: ' . $e->getMessage()], 500);
        }
    }

    public function cancel(Request $request)
    {
        $tenant = $request->user()->tenant;

        if ($tenant->subscribed()) {
            try {
                $tenant->subscription()->cancel();
                return response()->json(['message' => 'Aboneliğiniz dönem sonunda sona erecek şekilde iptal edildi.']);
            }
            catch (\Exception $e) {
                // Handle Paddle API error 'cannot update subscription, pending scheduled changes'
                if (str_contains(strtolower($e->getMessage()), 'pending scheduled changes')) {
                    return response()->json(['message' => 'Abonelik üzerinde bekleyen bir işlem (ödeme hazırlığı vb.) olduğu için şu an iptal edilemiyor. Lütfen kısa bir süre sonra tekrar deneyin.'], 422);
                }

                return response()->json(['message' => 'Paddle hatası: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['message' => 'Aktif bir abonelik bulunamadı veya zaten iptal edilmiş.'], 400);
    }

    public function checkout(Request $request)
    {
        $tenant = $request->user()->tenant;

        $packageId = $request->get('package_id');
        $package = $packageId ?\App\Models\Package::find($packageId) : $tenant->package;

        if (!$package) {
            return response()->json(['message' => 'Paket bulunamadı.'], 404);
        }

        if ($package->isFree()) {
            $tenant->applyPackage($package);
            return response()->json([
                'message' => 'Ücretsiz paket başarıyla tanımlandı.',
                'applied' => true
            ]);
        }

        if (!$package->paddle_price_id) {
            return response()->json(['message' => 'Bu paket için ödeme bilgisi tanımlanmamış.'], 400);
        }

        // Generate checkout
        $checkout = $tenant->checkout($package->paddle_price_id)
            ->returnTo(env('FRONTEND_URL', config('app.url')) . '/settings/subscription');

        // Force overlay display mode
        $checkoutData = $checkout->toArray();
        $checkoutData['settings']['displayMode'] = 'overlay';

        return response()->json([
            'checkout' => $checkoutData
        ]);
    }

    public function receipt(Request $request, $id)
    {
        $tenant = $request->user()->tenant;

        // Find the transaction by ID and ensure it belongs to the tenant
        $transaction = $tenant->transactions()->where('id', $id)->firstOrFail();

        try {
            $paddleTransaction = $transaction->asPaddleTransaction();

            if ($paddleTransaction && $paddleTransaction->receipt_url) {
                return response()->json(['url' => $paddleTransaction->receipt_url]);
            }

            return response()->json(['message' => 'Fatura bağlantısı bulunamadı.'], 404);
        }
        catch (\Exception $e) {
            return response()->json(['message' => 'Paddle hatası: ' . $e->getMessage()], 500);
        }
    }
}
