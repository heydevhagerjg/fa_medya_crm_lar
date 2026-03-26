<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\JobStepController;
use App\Http\Controllers\Api\JobFileController;
use App\Http\Controllers\Admin\SystemBackupController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\SearchController;
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
use App\Http\Controllers\Api\WorkflowController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth routes (public)
Route::group(['prefix' => 'auth'], function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/packages', [\App\Http\Controllers\Admin\PackageController::class, 'index']);
});

// Public Proposal Routes (Rate Limited)
Route::group(['prefix' => 'public', 'middleware' => 'throttle:30,1'], function () {
    Route::get('/proposals/{uuid}', [App\Http\Controllers\Api\PublicProposalController::class, 'show']);
    Route::get('/proposals/{uuid}/pdf', [App\Http\Controllers\Api\PublicProposalController::class, 'downloadPdf']);
    Route::post('/proposals/{uuid}/respond', [App\Http\Controllers\Api\PublicProposalController::class, 'respond']);

    // Signed backup download
    Route::get('/backup/download/{id}', [App\Http\Controllers\Api\BackupController::class, 'downloadPublicBackup'])
        ->name('backup.download.public')
        ->middleware('signed');
});

// Protected routes
Route::middleware(['auth:sanctum', 'throttle:api', 'check.tenant', 'check.restoring', 'tenant.s3', 'check.plan'])->group(function () {

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

    // Search
    Route::get('/search', [SearchController::class, 'search']);

    // Billing
    Route::get('/billing/subscription', [\App\Http\Controllers\Api\BillingController::class, 'subscription']);
    Route::get('/billing/checkout', [\App\Http\Controllers\Api\BillingController::class, 'checkout']);
    Route::post('/billing/cancel', [\App\Http\Controllers\Api\BillingController::class, 'cancel']);
    Route::post('/billing/swap', [\App\Http\Controllers\Api\BillingController::class, 'swap']);
    Route::get('/billing/receipt/{id}', [\App\Http\Controllers\Api\BillingController::class, 'receipt']);

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
    Route::post('/files/bulk-delete', [JobFileController::class, 'bulkDestroy']);
    Route::get('/files/trash', [JobFileController::class, 'trash']);
    Route::post('/files/trash/clear', [JobFileController::class, 'clearTrash']);
    Route::post('/files/{id}/restore', [JobFileController::class, 'restore']);
    Route::delete('/files/{id}/force', [JobFileController::class, 'forceDelete']);
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
    Route::post('/proposals/{id}/mark-all-paid', [\App\Http\Controllers\Api\ProposalController::class, 'markAllInstallmentsPaid']);
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
            Route::post('/backup/export', [BackupController::class, 'export'])->middleware('check.plan:backup');
            Route::post('/backup/request', [BackupController::class, 'requestBackup'])->middleware('check.plan:backup');
            Route::post('/backup/cancel-request', [BackupController::class, 'cancelRequest'])->middleware('check.plan:backup');
            Route::get('/backup/list', [BackupController::class, 'listAppBackups'])->middleware('check.plan:backup');
            Route::get('/backup/{id}/download', [BackupController::class, 'downloadAppBackup'])->middleware('check.plan:backup');
            Route::get('/backup/{id}/signed-url', [BackupController::class, 'getSignedUrl'])->middleware('check.plan:backup');
            Route::delete('/backup/{id}', [BackupController::class, 'deleteAppBackup'])->middleware('check.plan:backup');
            Route::post('/backup/import', [BackupController::class, 'import'])->middleware('check.plan:backup');
            Route::post('/backup/reset', [BackupController::class, 'reset']);

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
        
        // Workflows
        Route::get('/workflow-logs', [WorkflowController::class, 'logs'])->middleware('role.admin');
        Route::patch('/workflows/{id}/toggle', [WorkflowController::class, 'toggle'])->middleware('role.admin');
        Route::apiResource('workflows', WorkflowController::class)->middleware('role.admin');
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
            Route::post('/bulk-delete', [\App\Http\Controllers\Admin\TenantController::class, 'bulkDestroy']);
            Route::post('/', [\App\Http\Controllers\Admin\TenantController::class, 'store']);
            Route::post('/import', [\App\Http\Controllers\Admin\TenantController::class, 'import']);
            Route::get('/{id}', [\App\Http\Controllers\Admin\TenantController::class, 'show']);
            Route::post('/{id}/users', [\App\Http\Controllers\Admin\TenantController::class, 'addUser']);
            Route::put('/{id}/limits', [\App\Http\Controllers\Admin\TenantController::class, 'updateLimits']);
            Route::put('/{id}/change-package', [\App\Http\Controllers\Admin\TenantController::class, 'changePackage']);
            Route::post('/{id}/gift-package', [\App\Http\Controllers\Admin\TenantController::class, 'giftPackage']);
            Route::put('/{id}/s3-config', [\App\Http\Controllers\Admin\TenantController::class, 'updateS3Config']);
            Route::put('/{id}/status', [\App\Http\Controllers\Admin\TenantController::class, 'updateStatus']);
            Route::post('/{id}/reject-backup-request', [\App\Http\Controllers\Admin\TenantController::class, 'rejectBackupRequest']);
            Route::get('/{id}/backup', [\App\Http\Controllers\Admin\TenantController::class, 'backup']); // Direct download (Keep for compatibility)
            Route::post('/{id}/backup', [\App\Http\Controllers\Admin\TenantController::class, 'createBackup']); // Background backup
            Route::get('/{id}/backups', [\App\Http\Controllers\Admin\TenantController::class, 'backups']); // List backups
            Route::get('/backups', [\App\Http\Controllers\Admin\TenantController::class, 'allBackups']); // List all backups
            Route::post('/backups/{id}/cancel', [\App\Http\Controllers\Admin\TenantController::class, 'cancelBackup']); // Cancel background backup
            Route::delete('/backups/{id}', [\App\Http\Controllers\Admin\TenantController::class, 'deleteBackup']); // Delete backup record and file
            Route::get('/backups/{backupId}/download', [\App\Http\Controllers\Admin\TenantController::class, 'downloadBackup']); // Download local backup
            Route::get('/backups/{id}/signed-url', [\App\Http\Controllers\Admin\TenantController::class, 'getDownloadSignedUrl']); // Signed download url
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

        Route::prefix('backups')->group(function () {
             Route::get('/', [SystemBackupController::class, 'index']);
             Route::post('/', [SystemBackupController::class, 'create']);
             Route::get('/download', [SystemBackupController::class, 'download']);
             Route::post('/destroy', [SystemBackupController::class, 'destroy']);
        });
    });
});
