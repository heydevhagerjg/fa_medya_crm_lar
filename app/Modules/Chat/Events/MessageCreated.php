<?php

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Message $message
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('chat.' . $this->message->chat_id),
        ];

        // Ayrıca tüm katılımcıların kendi odalarına da gönderelim ki listeleri/bildirimleri düşsün
        $participants = $this->message->chat->participants()->pluck('user_id');
        foreach ($participants as $userId) {
            $channels[] = new PrivateChannel('user.chats.' . $userId);
        }

        return $channels;
    }

    /**
     * Broadcast alias for event.
     */
    public function broadcastAs(): string
    {
        return 'message.created';
    }

    /**
     * Custom broadcast data.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'chat_id' => $this->message->chat_id,
            'user_id' => $this->message->user_id,
            'content' => $this->message->content,
            'type' => $this->message->type,
            'metadata' => $this->message->metadata,
            'created_at' => $this->message->created_at->toISOString(),
            'user' => [
                'id' => $this->message->user?->id,
                'name' => $this->message->user?->name,
                'email' => $this->message->user?->email,
            ],
            'attachments' => $this->message->attachments->map(fn($a) => [
                'id' => $a->id,
                'file_name' => $a->file_name,
                'file_type' => $a->file_type,
                'file_size' => $a->file_size,
                's3_url' => $a->s3_url,
                'preview_url' => $a->preview_url,
            ]),
        ];
    }
}
