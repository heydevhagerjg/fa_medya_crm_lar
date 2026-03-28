<?php

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Models\Chat;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Chat $chat
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [];

        // Broadcast to each participant's private channel
        foreach ($this->chat->participants as $participant) {
            $channels[] = new PrivateChannel('user.chats.' . $participant->user_id);
        }

        return $channels;
    }

    /**
     * Broadcast alias for event.
     */
    public function broadcastAs(): string
    {
        return 'chat.created';
    }

    /**
     * Custom broadcast data.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->chat->id,
            'name' => $this->chat->name,
            'chateable_type' => $this->chat->chateable_type,
            'chateable_id' => $this->chat->chateable_id,
            'created_at' => $this->chat->created_at->toISOString(),
            'last_message_at' => $this->chat->last_message_at?->toISOString(),
            'participants' => $this->chat->participants->map(fn($p) => [
                'user_id' => $p->user_id,
                'role' => $p->role,
                'user_name' => $p->user?->name,
            ]),
        ];
    }
}
