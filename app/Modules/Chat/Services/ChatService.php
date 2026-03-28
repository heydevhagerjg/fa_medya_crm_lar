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
            $chat = null;

            if ($entityType === 'User') {
                // Ensure a direct chat strictly belongs to these two users
                $chat = Chat::where('tenant_id', $tenantId)
                    ->where('chateable_type', 'User')
                    ->whereHas('participants', fn($q) => $q->where('user_id', auth()->id()))
                    ->whereHas('participants', fn($q) => $q->where('user_id', $entityId))
                    ->first();
            } else {
                // Find existing polymorphic chat for non-User types
                $chat = Chat::where('tenant_id', $tenantId)
                    ->where('chateable_type', $entityType)
                    ->where('chateable_id', $entityId)
                    ->first();
            }

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

            try {
                event(new ChatCreated($chat));
            } catch (\Exception $e) {
                app('log')->error('Broadcasting failed: ' . $e->getMessage());
            }

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
            ->map(function ($p) {
                $chat = $p->chat;
                // Use setAttribute to ensure it's included in the JSON response
                $chat->setAttribute('unread_count', (int)$p->unread_count);
                return $chat;
            })
            ->sortByDesc('last_message_at')
            ->values();
    }

    /**
     * Get ALL chats for a tenant (Admins only).
     */
    public function getTenantChats(string $tenantId, string $userId): Collection
    {
        // Get all chats in the tenant
        $chats = Chat::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->with(['lastMessage', 'participants.user'])
            ->get();

        // Get unread counts for this specific user where they are a participant
        $participants = ChatParticipant::where('user_id', $userId)
            ->pluck('unread_count', 'chat_id');

        return $chats->map(function ($chat) use ($participants) {
            $chat->setAttribute('unread_count', (int)($participants[$chat->id] ?? 0));
            return $chat;
        })
        ->sortByDesc('last_message_at')
        ->values();
    }

    /**
     * Create a new group chat with a name and multiple participants.
     */
    public function createGroupChat(
        string $name,
        array $participantIds,
        ?string $description = null,
        ?string $tenantId = null
    ): Chat {
        $tenantId = $tenantId ?? auth()->user()->tenant_id;

        return DB::transaction(function () use ($name, $participantIds, $description, $tenantId) {
            $chat = Chat::create([
                'tenant_id'      => $tenantId,
                'chateable_type' => 'Group',
                'chateable_id'   => (string) \Illuminate\Support\Str::uuid(),
                'name'           => $name,
                'description'    => $description,
                'created_by'     => auth()->id(),
            ]);

            // Add creator as owner
            $chat->participants()->create([
                'user_id'   => auth()->id(),
                'role'      => 'owner',
                'joined_at' => now(),
            ]);

            // Add all specified participants as members
            $this->addParticipants($chat, $participantIds);

            try {
                event(new ChatCreated($chat));
            } catch (\Exception $e) {
                app('log')->error('Broadcasting failed: ' . $e->getMessage());
            }

            return $chat->load('participants.user');
        });
    }
}
