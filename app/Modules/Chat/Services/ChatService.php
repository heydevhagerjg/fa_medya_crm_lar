<?php

namespace App\Modules\Chat\Services;

use App\Modules\Chat\Events\ChatCreated;
use App\Modules\Chat\Models\Chat;
use App\Modules\Chat\Models\ChatParticipant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ChatService
{
    /**
     * Create or retrieve a chat for a specific entity (Polymorphic).
     */
    public function createOrGetChat(
        string $entityType,
        string|int $entityId,
        array $participantIds = [],
        ?string $name = null,
        ?string $tenantId = null
    ): Chat {
        $tenantId = $tenantId ?? auth()->user()->tenant_id;

        return DB::transaction(function () use ($entityType, $entityId, $participantIds, $name, $tenantId) {
            // Find existing polymorphic chat
            $chat = Chat::where('tenant_id', $tenantId)
                ->where('chateable_type', $entityType)
                ->where('chateable_id', $entityId)
                ->first();

            if ($chat) {
                // Optionally add new participants if they don't exist
                if (!empty($participantIds)) {
                    $this->addParticipants($chat, $participantIds);
                }
                return $chat;
            }

            // Create new chat
            $chat = Chat::create([
                'tenant_id' => $tenantId,
                'chateable_type' => $entityType,
                'chateable_id' => $entityId,
                'name' => $name,
                'created_by' => auth()->id(),
            ]);

            // Add creator as owner
            $chat->participants()->create([
                'user_id' => auth()->id(),
                'role' => 'owner',
            ]);

            // Add other participants
            if (!empty($participantIds)) {
                $this->addParticipants($chat, $participantIds);
            }

            event(new ChatCreated($chat));

            return $chat;
        });
    }

    /**
     * Add participants to a chat.
     */
    public function addParticipants(Chat $chat, array $userIds): void
    {
        foreach ($userIds as $userId) {
            if ($userId !== auth()->id()) {
                $chat->participants()->updateOrCreate(
                    ['user_id' => $userId],
                    ['is_active' => true, 'role' => 'member', 'joined_at' => now()]
                );
            }
        }
    }

    /**
     * Get user's active chats.
     */
    public function getUserChats(string $userId, ?string $tenantId = null): Collection
    {
        $tenantId = $tenantId ?? auth()->user()->tenant_id;

        return ChatParticipant::where('user_id', $userId)
            ->whereHas('chat', function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)
                    ->where('is_archived', false);
            })
            ->with(['chat.lastMessage', 'chat.participants.user'])
            ->get()
            ->map(fn($p) => $p->chat)
            ->sortByDesc('last_message_at')
            ->values();
    }
}
