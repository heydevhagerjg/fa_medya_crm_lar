<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    return \App\Modules\Chat\Models\ChatParticipant::where('chat_id', $chatId)
        ->where('user_id', $user->id)
        ->where('is_active', true)
        ->exists();
});

Broadcast::channel('user.chats.{userId}', function ($user, $userId) {
    return $user->id === $userId;
});
