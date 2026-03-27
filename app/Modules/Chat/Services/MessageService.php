<?php

namespace App\Modules\Chat\Services;

use App\Modules\Chat\Events\MessageCreated;
use App\Modules\Chat\Models\Chat;
use App\Modules\Chat\Models\Message;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MessageService
{
    /**
     * Store a new message in a chat.
     */
    public function sendMessage(
        Chat $chat,
        string $content,
        string $type = 'text',
        array $metadata = [],
        ?string $userId = null
    ): Message {
        $userId = $userId ?? auth()->id();

        return DB::transaction(function () use ($chat, $content, $type, $metadata, $userId) {
            $message = $chat->messages()->create([
                'user_id' => $userId,
                'content' => $content,
                'type' => $type,
                'metadata' => $metadata,
            ]);

            // Update chat last message time & count
            $chat->update([
                'last_message_at' => $message->created_at,
                'message_count' => (int)$chat->message_count + 1,
            ]);

            // Broadcast message
            event(new \App\Modules\Chat\Events\MessageCreated($message));

            return $message;
        });
    }

    /**
     * Paginate messages for a chat (Cursor based).
     */
    public function paginateMessages(Chat $chat, ?int $cursor = null, int $limit = 50): array
    {
        $query = $chat->messages()
            ->with(['user', 'attachments'])
            ->orderBy('id', 'DESC');

        if ($cursor) {
            $query->where('id', '<', $cursor);
        }

        $messages = $query->limit($limit + 1)->get()->reverse();

        /** @var \Illuminate\Support\Collection $messages */
        $hasMore = $messages->count() > $limit;
        if ($hasMore) {
            $messages->shift();
        }

        $firstMessage = $messages->first();

        return [
            'data' => $messages->values(),
            'next_cursor' => $firstMessage instanceof Message ? $firstMessage->id : null,
            'has_more' => $hasMore,
        ];
    }

    /**
     * Mark messages read for user in chat.
     */
    public function markAsRead(Chat $chat, string $userId): void
    {
        /** @var Message|null $latestMessage */
        $latestMessage = $chat->messages()->latest()->first();
        $lastMessageId = $latestMessage ? $latestMessage->id : null;

        $chat->participants()
            ->where('user_id', $userId)
            ->update([
                'last_read_message_id' => $lastMessageId,
                'last_read_at' => now(),
                'unread_count' => 0,
            ]);
    }
}
