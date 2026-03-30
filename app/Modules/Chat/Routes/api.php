<?php

use App\Modules\Chat\Controllers\ChatController;
use App\Modules\Chat\Controllers\ChatCallController;
use App\Modules\Chat\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::get('/chats/attachments/{id}', [MessageController::class, 'proxyAttachment'])
    ->name('chats.attachment.proxy')
    ->middleware('signed');

Route::middleware(['auth:sanctum', 'throttle:api', 'check.tenant', 'check.restoring', 'tenant.s3'])->group(function () {
    // ─── UTILS ───────────────────────────────────────────────────────────
    Route::get('/chats/users-list', [ChatController::class, 'listUsers']);

    // ─── CHATS ───────────────────────────────────────────────────────────
    Route::get('/chats', [ChatController::class, 'index']);
    
    // Chat limit kontrolü sadece oluşturma operasyonlarına uygulanıyor
    Route::middleware('check.plan:chat')->group(function () {
        Route::post('/chats', [ChatController::class, 'store']);
        Route::post('/chats/group', [ChatController::class, 'storeGroup']);
    });
    
    Route::get('/chats/{chat}', [ChatController::class, 'show']);
    Route::delete('/chats/{chat}', [ChatController::class, 'destroy']);
    Route::post('/chats/{chat}/participants', [ChatController::class, 'addParticipants']);
    Route::delete('/chats/{chat}/participants/{user}', [ChatController::class, 'removeParticipant']);

    // ─── MESSAGES ────────────────────────────────────────────────────────
    Route::get('/chats/{chat}/messages', [MessageController::class, 'index']);
    Route::post('/chats/{chat}/messages', [MessageController::class, 'store']);
    Route::post('/chats/{chat}/read', [MessageController::class, 'markAsRead']);
    Route::post('/chats/{chat}/attachments', [MessageController::class, 'uploadAttachment']);
    Route::delete('/chats/{chat}/messages/{message}', [MessageController::class, 'destroy']);

    // ─── CALLS ───────────────────────────────────────────────────────────
    Route::get('/chats/{chat}/calls/active', [ChatCallController::class, 'active']);
    Route::post('/chats/{chat}/calls', [ChatCallController::class, 'start']);
    Route::post('/chats/{chat}/calls/{call}/accept', [ChatCallController::class, 'accept']);
    Route::post('/chats/{chat}/calls/{call}/reject', [ChatCallController::class, 'reject']);
    Route::post('/chats/{chat}/calls/{call}/end', [ChatCallController::class, 'end']);
    Route::get('/chats/{chat}/calls/{call}/token', [ChatCallController::class, 'token']);
    Route::post('/chats/{chat}/calls/{call}/signal', [ChatCallController::class, 'signal']);
});
