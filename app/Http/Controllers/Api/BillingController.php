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
                    } elseif (!empty($paddleSub->billingCycle)) {
                        $nextBilledAt = $paddleSub->billingCycle['next_step_at'] ?? null;
                    } elseif (!empty($paddleSub->currentBillingPeriod)) {
                        $nextBilledAt = $paddleSub->currentBillingPeriod['ends_at'] ?? null;
                    }
                }
            } catch (\Exception $e) {
                // If API fails, log it or ignore
            }
        }
        
        return response()->json([
            'is_on_trial' => $tenant->onTrial(),
            'trial_ends_at' => $tenant->trialEndsAt() ? $tenant->trialEndsAt()->toIso8601String() : null,
            'is_subscribed' => $tenant->subscribed(),
            'subscription' => $subscription ? array_merge($subscription->toArray(), ['next_billed_at' => $nextBilledAt]) : null,
            'package' => $tenant->package,
            'receipts' => $tenant->transactions()->latest()->get(),
            'all_packages' => \App\Models\Package::where('is_active', true)->get(),
        ]);
    }

    public function swap(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:packages,id'
        ]);

        $tenant = $request->user()->tenant;
        $package = \App\Models\Package::findOrFail($request->package_id);

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
        } catch (\Exception $e) {
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
            } catch (\Exception $e) {
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
        $package = $packageId ? \App\Models\Package::find($packageId) : $tenant->package;

        if (!$package || !$package->paddle_price_id) {
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
        } catch (\Exception $e) {
            return response()->json(['message' => 'Paddle hatası: ' . $e->getMessage()], 500);
        }
    }
}
