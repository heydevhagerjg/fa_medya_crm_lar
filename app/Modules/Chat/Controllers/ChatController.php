<?php

namespace App\Modules\Chat\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Models\Chat;
use App\Modules\Chat\Services\ChatService;
use App\Modules\Chat\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(
        protected ChatService $chatService,
        protected MessageService $messageService
    ) {}

    /**
     * List user's chats.
     */
    public function index(Request $request): JsonResponse
    {
        $chats = $this->chatService->getUserChats($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $chats
        ]);
    }

    /**
     * Retrieve or create a chat for an entity.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'entity_type' => 'required|string',
            'entity_id' => 'required',
            'participant_ids' => 'sometimes|array',
            'name' => 'sometimes|string|nullable'
        ]);

        $chat = $this->chatService->createOrGetChat(
            $request->entity_type,
            $request->entity_id,
            $request->get('participant_ids', []),
            $request->get('name')
        );

        return response()->json([
            'success' => true,
            'data' => $chat
        ]);
    }

    /**
     * Delete (permanently remove) a chat.
     * Only the chat owner or a tenant admin can delete.
     */
    public function destroy(Chat $chat, Request $request): JsonResponse
    {
        $user = $request->user();

        $isParticipant = $chat->participants()->where('user_id', $user->id)->exists();
        if (!$isParticipant) {
            return response()->json(['message' => 'Bu sohbete erişim yetkiniz yok.'], 403);
        }

        $isOwner = $chat->created_by === $user->id;
        $isAdmin = in_array($user->role, ['ADMIN', 'SUPER_ADMIN']);

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Sohbeti yalnızca oluşturan kişi veya yönetici silebilir.'], 403);
        }

        $chat->delete();

        return response()->json(['success' => true, 'message' => 'Sohbet silindi.']);
    }

    /**
     * Show chat details with initial messages.
     */
    public function show(Chat $chat, Request $request): JsonResponse
    {
        // Check if user is a participant
        $isParticipant = $chat->participants()->where('user_id', $request->user()->id)->exists();
        if (!$isParticipant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get initial messages
        $pagination = $this->messageService->paginateMessages($chat);

        return response()->json([
            'success' => true,
            'data' => [
                'chat' => $chat->load('participants.user'),
                'messages' => $pagination['data'],
                'next_cursor' => $pagination['next_cursor'],
                'has_more' => $pagination['has_more'],
            ]
        ]);
    }
}
