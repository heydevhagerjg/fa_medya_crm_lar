<?php

namespace App\Modules\Chat\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Models\Chat;
use App\Modules\Chat\Models\Message;
use App\Modules\Chat\Services\FileService;
use App\Modules\Chat\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(
        protected MessageService $messageService,
        protected FileService $fileService
    ) {}

    /**
     * Store new message in chat.
     */
    public function store(Chat $chat, Request $request): JsonResponse
    {
        $request->validate([
            'content' => 'required|string',
            'type' => 'sometimes|in:text,file,system',
            'metadata' => 'sometimes|array'
        ]);

        // Check user participation
        $isParticipant = $chat->participants()->where('user_id', $request->user()->id)->exists();
        if (!$isParticipant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message = $this->messageService->sendMessage(
            $chat,
            $request->content,
            $request->get('type', 'text'),
            $request->get('metadata', [])
        );

        return response()->json([
            'success' => true,
            'data' => $message->load('user', 'attachments')
        ]);
    }

    /**
     * Paginate chat messages.
     */
    public function index(Chat $chat, Request $request): JsonResponse
    {
        // Check user participation
        $isParticipant = $chat->participants()->where('user_id', $request->user()->id)->exists();
        if (!$isParticipant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pagination = $this->messageService->paginateMessages(
            $chat,
            $request->get('cursor')
        );

        return response()->json([
            'success' => true,
            'data' => $pagination['data'],
            'next_cursor' => $pagination['next_cursor'],
            'has_more' => $pagination['has_more'],
        ]);
    }

    /**
     * Mark chat messages as read.
     */
    public function markAsRead(Chat $chat, Request $request): JsonResponse
    {
        $this->messageService->markAsRead($chat, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Chat marked as read.'
        ]);
    }

    /**
     * Upload an attachment to a message.
     */
    public function uploadAttachment(Chat $chat, Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200' // max 50MB
        ]);

        // 1. Send placeholder message
        $message = $this->messageService->sendMessage($chat, '', 'file');

        // 2. Upload to S3
        try {
            $attachment = $this->fileService->uploadMessageAttachment($message, $request->file('file'));

            return response()->json([
                'success' => true,
                'data' => $message->load('attachments')
            ]);
        } catch (\Exception $e) {
            $message->delete(); // Rollback placeholder
            return response()->json(['message' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }
}
