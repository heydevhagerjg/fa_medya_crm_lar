<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\JobStepController;
use App\Http\Controllers\Api\JobFileController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\Settings\ServiceController;
use App\Http\Controllers\Api\Settings\JobStatusController;
use App\Http\Controllers\Api\Settings\StepTemplateController;
use App\Http\Controllers\Api\Settings\CashRegisterController;
use App\Http\Controllers\Api\Settings\ExpenseCategoryController;
use App\Http\Controllers\Api\Settings\ApiKeyController;
use App\Http\Controllers\Api\AppointmentTitleController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\ServiceTrackingController;
use App\Http\Controllers\Api\Settings\ServiceTrackingCategoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::get('/auth/sessions', [AuthController::class, 'getSessions']);
    Route::delete('/auth/sessions/{id}', [AuthController::class, 'revokeSession']);
    Route::post('/auth/sessions/revoke-others', [AuthController::class, 'revokeOtherSessions']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Customers
    Route::apiResource('customers', CustomerController::class);

    // Jobs
    Route::apiResource('jobs', JobController::class);
    Route::patch('/jobs/{id}/status', [JobController::class, 'updateStatus']);

    // Payments (using query param id for delete like the original API)
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    // Job Steps
    Route::patch('/steps/{id}', [JobStepController::class, 'update']);
    Route::post('/steps', [JobStepController::class, 'store']);
    Route::delete('/steps/{id}', [JobStepController::class, 'destroy']);
    Route::post('/jobs/{id}/steps/template', [JobStepController::class, 'applyTemplate']);

    // Files
    Route::get('/files', [JobFileController::class, 'index']);
    Route::get('/files/download', [JobFileController::class, 'download']);
    Route::get('/files/proxy', [JobFileController::class, 'proxyDownload']);
    Route::post('/files', [JobFileController::class, 'store']);
    Route::delete('/files/{id}', [JobFileController::class, 'destroy']);
    Route::post('/jobs/{id}/files', [JobFileController::class, 'store']);
    Route::delete('/jobs/{id}/files', [JobFileController::class, 'destroy']);

    // Logs
    Route::get('/logs', [LogController::class, 'index']);

    // Appointments
    Route::apiResource('appointments', AppointmentController::class);

    // Service Tracking
    Route::apiResource('service-trackings', ServiceTrackingController::class);
    Route::post('service-trackings/{id}/complete', [ServiceTrackingController::class, 'complete']);
    Route::post('service-trackings/{id}/catch-up', [ServiceTrackingController::class, 'catchUp']);
    Route::get('service-trackings/{id}/logs', [ServiceTrackingController::class, 'logs']);
    Route::put('service-tracking-logs/{logId}/status', [ServiceTrackingController::class, 'updateLogStatus']);
    Route::post('service-trackings/{id}/cancel', [ServiceTrackingController::class, 'cancel']);
    Route::post('service-trackings/{id}/activate', [ServiceTrackingController::class, 'activate']);



    // Settings
    Route::prefix('settings')->group(function () {
        // Backup
        Route::get('/backup/export', [BackupController::class, 'export']);
        Route::post('/backup/import', [BackupController::class, 'import']);
        Route::post('/backup/reset', [BackupController::class, 'reset']);
        Route::get('/backup/s3/list', [BackupController::class, 'listS3Backups']);
        Route::get('/backup/s3/download', [BackupController::class, 'downloadS3Backup']);

        // Service Tracking Categories
        Route::apiResource('service-tracking-categories', ServiceTrackingCategoryController::class);

        // Services
        Route::apiResource('services', ServiceController::class);

        // Job Statuses
        Route::post('/statuses/reorder', [JobStatusController::class, 'reorder']);
        Route::apiResource('statuses', JobStatusController::class);

        // Step Templates
        Route::apiResource('templates', StepTemplateController::class);

        // Cash Registers
        Route::apiResource('cash-registers', CashRegisterController::class);

        // Expense Categories
        Route::apiResource('expense-categories', ExpenseCategoryController::class);

        // API Keys
        Route::apiResource('api-keys', ApiKeyController::class)->except(['show']);
        Route::apiResource('appointment-titles', AppointmentTitleController::class);

        // Backup Keys
        Route::post('/backup-keys/clear', [\App\Http\Controllers\Api\Settings\BackupKeyController::class, 'clearAll']);
        Route::apiResource('backup-keys', \App\Http\Controllers\Api\Settings\BackupKeyController::class)->only(['index', 'store', 'destroy']);

        // Tenant Settings (S3 etc)
        Route::get('/tenant', [TenantController::class, 'show']);
        Route::put('/tenant', [TenantController::class, 'update']);
        Route::post('/tenant/test', [TenantController::class, 'testConnection']);
    });
});
