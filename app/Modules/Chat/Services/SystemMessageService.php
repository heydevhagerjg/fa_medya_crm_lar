<?php

namespace App\Modules\Chat\Services;

use App\Models\ActivityLog;
use App\Modules\Chat\Models\Chat;
use App\Modules\Chat\Models\Message;

class SystemMessageService
{
    /**
     * Create a system message from an activity log entry.
     */
    public function logActivityToChat(ActivityLog $activity, Chat $chat): ?Message
    {
        // Format the message content
        $content = "{$activity->action} on {$activity->entity_type}: " . ($activity->entity_name ?: $activity->entity_id);
        
        // Save as SYSTEM type message
        $message = $chat->messages()->create([
            'user_id' => $activity->user_id,
            'content' => $content,
            'type' => 'system',
            'metadata' => [
                'activity_id' => $activity->id,
                'action' => $activity->action,
                'entity_type' => $activity->entity_type,
                'entity_id' => $activity->entity_id,
                'details' => $activity->details,
            ],
        ]);

        // Trigger real-time update
        event(new \App\Modules\Chat\Events\MessageCreated($message));

        return $message;
    }
}
