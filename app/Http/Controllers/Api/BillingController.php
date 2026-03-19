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
                // Fetch live data from Paddle API v2
                $paddleSub = $subscription->asPaddleSubscription();
                $nextBilledAt = $paddleSub->nextBilledAt ? $paddleSub->nextBilledAt->format('Y-m-d H:i:s') : null;
                
                // Add to the model instance for the JSON response
                $subscription->next_billed_at = $nextBilledAt;
            } catch (\Exception $e) {
                // Fallback or ignore
            }
        }
        
        return response()->json([
            'is_on_trial' => $tenant->onTrial(),
            'trial_ends_at' => $tenant->trialEndsAt() ? $tenant->trialEndsAt()->toIso8601String() : null,
            'is_subscribed' => $tenant->subscribed(),
            'subscription' => $subscription,
            'package' => $tenant->package,
            'receipts' => $tenant->transactions()->latest()->get(),
        ]);
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
        $package = $tenant->package;

        if (!$package || !$package->paddle_price_id) {
            return response()->json(['message' => 'Bu paket için ödeme bilgisi tanımlanmamış. Lütfen yönetici ile iletişime geçin.'], 400);
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
}
