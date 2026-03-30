<?php

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Models\ChatCallSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatCallIncoming implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param array<int, string> $targetUserIds
     */
    public function __construct(
        public ChatCallSession $callSession,
        public array $targetUserIds
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];
        foreach ($this->targetUserIds as $userId) {
            $channels[] = new PrivateChannel('user.chats.' . $userId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'chat.call.incoming';
    }

    public function broadcastWith(): array
    {
        $this->callSession->loadMissing(['starter', 'participants.user']);

        return [
            'id' => $this->callSession->id,
            'chat_id' => $this->callSession->chat_id,
            'status' => $this->callSession->status,
            'type' => $this->callSession->type,
            'started_by' => $this->callSession->started_by,
            'caller_name' => $this->callSession->starter?->name,
            'started_at' => $this->callSession->started_at?->toISOString(),
            'participants' => $this->callSession->participants->map(fn ($p) => [
                'user_id' => $p->user_id,
                'status' => $p->status,
                'name' => $p->user?->name,
            ])->values(),
        ];
    }
}
