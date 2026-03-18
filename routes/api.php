<?php

use Illuminate\Support\Facades\Route;
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
use App\Http\Controllers\Api\Settings\RoleController;
use App\Http\Controllers\Api\Settings\PermissionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/packages', [\App\Http\Controllers\Admin\PackageController::class, 'index']);
});

// Public Proposal Routes
Route::prefix('public')->group(function () {
    Route::get('/proposals/{uuid}', [App\Http\Controllers\Api\PublicProposalController::class, 'show']);
    Route::get('/proposals/{uuid}/pdf', [App\Http\Controllers\Api\PublicProposalController::class, 'downloadPdf']);
    Route::post('/proposals/{uuid}/respond', [App\Http\Controllers\Api\PublicProposalController::class, 'respond']);
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
    Route::apiResource('customers', CustomerController::class)->middleware('check.plan:customer');

    // Jobs
    Route::post('/jobs/reorder', [JobController::class, 'reorder']);
    Route::apiResource('jobs', JobController::class)->middleware('check.plan:job');
    Route::patch('/jobs/{id}/status', [JobController::class, 'updateStatus']);

    // Payments
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}/receipt', [PaymentController::class, 'receipt']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);
    Route::get('/expenses/{id}/receipt', [ExpenseController::class, 'receipt']);

    // Job Steps
    Route::patch('/steps/{id}', [JobStepController::class, 'update']);
    Route::post('/steps', [JobStepController::class, 'store']);
    Route::delete('/steps/{id}', [JobStepController::class, 'destroy']);
    Route::post('/jobs/{id}/steps/template', [JobStepController::class, 'applyTemplate']);

    // Files
    Route::get('/files', [JobFileController::class, 'index']);
    Route::get('/files/{id}/download', [JobFileController::class, 'download']);
    Route::post('/files', [JobFileController::class, 'store']);
    Route::delete('/files/{id}', [JobFileController::class, 'destroy']);
    Route::post('/jobs/{id}/files', [JobFileController::class, 'store']);
    Route::delete('/jobs/{id}/files', [JobFileController::class, 'destroy']);

    // Logs
    Route::get('/logs', [LogController::class, 'index'])->middleware('role.admin');

    // Appointments
    Route::apiResource('appointments', AppointmentController::class)->middleware('check.plan:appointment');

    // Service Tracking
    Route::apiResource('service-trackings', ServiceTrackingController::class)->middleware('check.plan:service_tracking');
    Route::post('service-trackings/{id}/complete', [ServiceTrackingController::class, 'complete']);
    Route::post('service-trackings/{id}/catch-up', [ServiceTrackingController::class, 'catchUp']);
    Route::get('service-trackings/{id}/logs', [ServiceTrackingController::class, 'logs']);
    Route::put('service-tracking-logs/{logId}/status', [ServiceTrackingController::class, 'updateLogStatus']);
    Route::delete('service-tracking-logs/{logId}', [ServiceTrackingController::class, 'deleteLog']);
    Route::post('service-trackings/{id}/cancel', [ServiceTrackingController::class, 'cancel']);
    Route::post('service-trackings/{id}/activate', [ServiceTrackingController::class, 'activate']);

    // Proposals
    Route::patch('/proposals/installments/{id}/toggle-paid', [\App\Http\Controllers\Api\ProposalController::class, 'toggleInstallmentPaid']);
    Route::post('/proposals/{id}/send', [\App\Http\Controllers\Api\ProposalController::class, 'send']);
    Route::post('/proposals/{id}/recall', [App\Http\Controllers\Api\ProposalController::class, 'recall']);
    Route::post('/proposals/{id}/create-job', [App\Http\Controllers\Api\ProposalController::class, 'createJob']);
    Route::post('/proposals/{proposalId}/revisions/{revisionId}/respond', [App\Http\Controllers\Api\ProposalController::class, 'respondToRevision']);
    Route::apiResource('proposals', App\Http\Controllers\Api\ProposalController::class)->middleware('check.plan:proposal');

    // Settings
    Route::prefix('settings')->group(function () {
        // Admin-only Settings
        Route::middleware('role.admin')->group(function () {
            // Backup
            Route::get('/backup/export', [BackupController::class, 'export'])->middleware('check.plan:backup');
            Route::post('/backup/import', [BackupController::class, 'import'])->middleware('check.plan:backup');
            Route::post('/backup/reset', [BackupController::class, 'reset']);
            Route::get('/backup/s3/list', [BackupController::class, 'listS3Backups']);
            Route::get('/backup/s3/download', [BackupController::class, 'downloadS3Backup']);

            // Activity Logs
            Route::apiResource('api-keys', ApiKeyController::class)->except(['show'])->middleware('check.plan:api_key');
            
            // User Management
            Route::apiResource('users', \App\Http\Controllers\Api\UserController::class)->except(['show'])->middleware('check.plan:personnel');
            
            // Backup Keys
            Route::post('/backup-keys/clear', [\App\Http\Controllers\Api\Settings\BackupKeyController::class, 'clearAll']);
            Route::apiResource('backup-keys', \App\Http\Controllers\Api\Settings\BackupKeyController::class)->only(['index', 'store', 'destroy']);
        });

        // Common Settings (or other non-critical ones if any)
        // Service Tracking Categories
        Route::apiResource('service-tracking-categories', ServiceTrackingCategoryController::class)->middleware('check.plan:service_tracking_category');

        // Services
        Route::apiResource('services', ServiceController::class)->middleware('check.plan:service');

        // Job Statuses
        Route::post('/statuses/reorder', [JobStatusController::class, 'reorder']);
        Route::apiResource('statuses', JobStatusController::class);

        // Step Templates
        Route::apiResource('templates', StepTemplateController::class)->middleware('check.plan:step_template');

        // Cash Registers
        Route::apiResource('cash-registers', CashRegisterController::class)->middleware('check.plan:cash_register');

        // Expense Categories
        Route::apiResource('expense-categories', ExpenseCategoryController::class);

        Route::apiResource('appointment-titles', AppointmentTitleController::class);

        // RBAC
        Route::middleware('role.admin')->group(function () {
            Route::apiResource('roles', RoleController::class);
            Route::get('permissions', [PermissionController::class, 'index']);
        });

        // Tenant Settings (S3 etc)
        Route::get('/tenant', [TenantController::class, 'show']);
        Route::put('/tenant', [TenantController::class, 'update'])->middleware('role.admin');
        Route::post('/tenant/test', [TenantController::class, 'testConnection'])->middleware('role.admin');
    });
});

// Admin Routes (Independent from User/Tenant)
Route::prefix('admin')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Admin\AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [\App\Http\Controllers\Admin\AuthController::class, 'me']);
        Route::post('/logout', [\App\Http\Controllers\Admin\AuthController::class, 'logout']);
        
        Route::prefix('tenants')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\TenantController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Admin\TenantController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Admin\TenantController::class, 'show']);
            Route::post('/{id}/users', [\App\Http\Controllers\Admin\TenantController::class, 'addUser']);
            Route::put('/{id}/limits', [\App\Http\Controllers\Admin\TenantController::class, 'updateLimits']);
            Route::put('/{id}/change-package', [\App\Http\Controllers\Admin\TenantController::class, 'changePackage']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\TenantController::class, 'destroy']);
        });

        Route::prefix('packages')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\PackageController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Admin\PackageController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Admin\PackageController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Admin\PackageController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\PackageController::class, 'destroy']);
            Route::post('/{id}/sync-tenants', [\App\Http\Controllers\Admin\PackageController::class, 'syncTenants']);
        });

        Route::prefix('settings')->group(function () {
             Route::get('/', [\App\Http\Controllers\Admin\S3ConfigController::class, 'index']);
             Route::post('/', [\App\Http\Controllers\Admin\S3ConfigController::class, 'store']);
             Route::get('/{s3_config}', [\App\Http\Controllers\Admin\S3ConfigController::class, 'show']);
             Route::put('/{s3_config}', [\App\Http\Controllers\Admin\S3ConfigController::class, 'update']);
             Route::delete('/{s3_config}', [\App\Http\Controllers\Admin\S3ConfigController::class, 'destroy']);
             Route::post('/test', [\App\Http\Controllers\Admin\S3ConfigController::class, 'testConnection']);
        });
    });
});
