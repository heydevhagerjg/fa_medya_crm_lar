<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

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
        Cashier::useCustomerModel(BillingCustomer::class);
    }
}
