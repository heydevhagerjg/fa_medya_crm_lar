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
        
        $customer = $tenant->customer;
        
        return response()->json([
            'is_on_trial' => $tenant->onTrial(),
            'trial_ends_at' => $tenant->trialEndsAt() ? $tenant->trialEndsAt()->toIso8601String() : null,
            'is_subscribed' => $tenant->subscribed(),
            'subscription' => $tenant->subscription(),
            'package' => $tenant->package,
            'receipts' => $tenant->transactions,
        ]);
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
