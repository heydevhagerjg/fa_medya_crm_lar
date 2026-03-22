<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

use Laravel\Paddle\Cashier;
use App\Models\BillingCustomer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define 'api' rate limiter for [throttle:api]
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        Cashier::useCustomerModel(BillingCustomer::class);

        // Paddle Webhook Sync for Tenant Packages
        \Illuminate\Support\Facades\Event::listen(\Laravel\Paddle\Events\WebhookReceived::class, function (\Laravel\Paddle\Events\WebhookReceived $event) {
            $payload = $event->payload;
            $eventType = $payload['event_type'] ?? '';

            if (in_array($eventType, ['transaction.completed', 'subscription.created', 'subscription.updated'])) {
                $priceId = null;
                $customerId = $payload['data']['customer_id'] ?? null;

                if ($eventType === 'transaction.completed') {
                    $priceId = $payload['data']['items'][0]['price']['id'] ?? null;
                } else {
                    // subscription.created or updated
                    $priceId = $payload['data']['items'][0]['price_id'] ?? null;
                }

                if ($priceId && $customerId) {
                    $package = \App\Models\Package::where('paddle_price_id', $priceId)->first();
                    $tenant = \Laravel\Paddle\Cashier::findBillable($customerId);

                    if ($package && $tenant instanceof \App\Models\Tenant) {
                        $tenant->applyPackage($package);
                    }
                }
            }
        });
    }
}
