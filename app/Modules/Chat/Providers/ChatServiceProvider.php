<?php

namespace App\Modules\Chat\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ChatServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind services for dependency injection
        $this->app->singleton(\App\Modules\Chat\Services\ChatService::class);
        $this->app->singleton(\App\Modules\Chat\Services\MessageService::class);
        $this->app->singleton(\App\Modules\Chat\Services\FileService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Route::middleware('api')
            ->prefix('api')
            ->group($this->getRoutesPath());
    }

    /**
     * Get routes path for the module.
     */
    protected function getRoutesPath(): string
    {
        return base_path('app/Modules/Chat/Routes/api.php');
    }
}
