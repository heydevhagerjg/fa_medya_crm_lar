<?php

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Models\ChatCallSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatCallSignal implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatCallSession $callSession,
        public string $fromUserId,
        public ?string $targetUserId,
        public string $signalType,
        public array $payload
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('chat.' . $this->callSession->chat_id),
        ];

        // Also send directly to the target user's personal channel so they
        // receive WebRTC signals even if they haven't opened the chat yet.
        if ($this->targetUserId) {
            $channels[] = new PrivateChannel('user.chats.' . $this->targetUserId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'chat.call.signal';
    }

    public function broadcastWith(): array
    {
        return [
            'call_id' => $this->callSession->id,
            'chat_id' => $this->callSession->chat_id,
            'from_user_id' => $this->fromUserId,
            'target_user_id' => $this->targetUserId,
            'signal_type' => $this->signalType,
            'payload' => $this->payload,
            'sent_at' => now()->toISOString(),
        ];
    }
}
