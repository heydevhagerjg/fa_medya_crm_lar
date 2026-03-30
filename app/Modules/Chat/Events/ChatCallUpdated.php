<?php

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Models\ChatCallSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatCallUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChatCallSession $callSession) {}

    public function broadcastOn(): array
    {
        $this->callSession->loadMissing('participants');

        $channels = [new PrivateChannel('chat.' . $this->callSession->chat_id)];
        foreach ($this->callSession->participants as $participant) {
            $channels[] = new PrivateChannel('user.chats.' . $participant->user_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'chat.call.updated';
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
            'answered_at' => $this->callSession->answered_at?->toISOString(),
            'ended_at' => $this->callSession->ended_at?->toISOString(),
            'ended_by' => $this->callSession->ended_by,
            'participants' => $this->callSession->participants->map(fn ($p) => [
                'user_id' => $p->user_id,
                'status' => $p->status,
                'name' => $p->user?->name,
                'joined_at' => $p->joined_at?->toISOString(),
                'left_at' => $p->left_at?->toISOString(),
            ])->values(),
        ];
    }
}
