<?php

use App\Modules\Chat\Controllers\ChatController;
use App\Modules\Chat\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // ─── CHATS ───────────────────────────────────────────────────────────
    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'store']);
    Route::get('/chats/{chat}', [ChatController::class, 'show']);

    // ─── MESSAGES ────────────────────────────────────────────────────────
    Route::get('/chats/{chat}/messages', [MessageController::class, 'index']);
    Route::post('/chats/{chat}/messages', [MessageController::class, 'store']);
    Route::post('/chats/{chat}/read', [MessageController::class, 'markAsRead']);
    Route::post('/chats/{chat}/attachments', [MessageController::class, 'uploadAttachment']);
});
