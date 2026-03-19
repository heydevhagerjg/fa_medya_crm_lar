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
        
        // Paddle v2: Try to get next payment date if active
        $nextBilledAt = null;
        if ($subscription && $subscription->active()) {
            // Cashier Paddle 2.x doesn't store this, but we can approximate it or get it from Paddle SDK if needed.
            // For now, let's use a safe check.
            try {
                // If it's stored in a custom column or meta we could use it, 
                // but standard Cashier uses Paddle Dashboard for most recurring data.
                // We'll return the object and let it have the field if it exists.
            } catch (\Exception $e) {}
        }
        
        return response()->json([
            'is_on_trial' => $tenant->onTrial(),
            'trial_ends_at' => $tenant->trialEndsAt() ? $tenant->trialEndsAt()->toIso8601String() : null,
            'is_subscribed' => $tenant->subscribed(),
            'subscription' => $subscription,
            'package' => $tenant->package,
            'receipts' => $tenant->transactions,
        ]);
    }

    public function cancel(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        if ($tenant->subscribed()) {
            $tenant->subscription()->cancel();
            return response()->json(['message' => 'Aboneliğiniz dönem sonunda sona erecek şekilde iptal edildi.']);
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
            ->returnTo(env('FRONTEND_URL', config('app.url')) . '/settings?tab=subscription');

        // Force overlay display mode
        $checkoutData = $checkout->toArray();
        $checkoutData['settings']['displayMode'] = 'overlay';

        return response()->json([
            'checkout' => $checkoutData
        ]);
    }
}
