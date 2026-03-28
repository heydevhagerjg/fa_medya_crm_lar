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
     * Create a direct (1-on-1) chat with a single user.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['ADMIN', 'SUPER_ADMIN']);

        if (!$isAdmin && !$user->can('chat.create')) {
            return response()->json(['message' => 'Sohbet oluşturma yetkiniz bulunmamaktadır.'], 403);
        }

        // Plan check (Middleware handles general chat check, we check count here)
        if ($user->tenant->reachedLimit('chat')) {
            $limit = $user->tenant->getLimitValue('chat');
            return response()->json(['message' => "Maksimum {$limit} adet sohbet limitine ulaştınız. Lütfen paketinizi yükseltiniz."], 403);
        }

        $request->validate([
            'entity_type'    => 'required|string',
            'entity_id'      => 'required',
            'participant_ids'=> 'sometimes|array',
            'name'           => 'sometimes|string|nullable',
        ]);

        $chat = $this->chatService->createOrGetChat(
            $request->entity_type,
            $request->entity_id,
            $request->get('participant_ids', []),
            $request->get('name')
        );

        return response()->json(['success' => true, 'data' => $chat]);
    }

    /**
     * Create a group chat with a name and multiple participants.
     */
    public function storeGroup(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['ADMIN', 'SUPER_ADMIN']);

        if (!$isAdmin && !$user->can('chat.create')) {
            return response()->json(['message' => 'Grup oluşturma yetkiniz bulunmamaktadır.'], 403);
        }

        // Plan check
        if ($user->tenant->reachedLimit('group_chat')) {
            $limit = $user->tenant->getLimitValue('group_chat');
            return response()->json(['message' => "Maksimum {$limit} adet grup sohbeti limitine ulaştınız. Lütfen paketinizi yükseltiniz."], 403);
        }

        $request->validate([
            'name'           => 'required|string|max:100',
            'participant_ids'=> 'required|array|min:2',
            'participant_ids.*' => 'exists:users,id',
            'description'    => 'sometimes|string|nullable|max:255',
        ]);

        $chat = $this->chatService->createGroupChat(
            $request->name,
            $request->participant_ids,
            $request->get('description')
        );

        return response()->json(['success' => true, 'data' => $chat], 201);
    }


    /**
     * Delete (permanently remove) a chat.
     * Only the chat owner or a tenant admin or user with chat.delete can delete.
     */
    public function destroy(Chat $chat, Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['ADMIN', 'SUPER_ADMIN']);
        $hasDeletePermission = $user->can('chat.delete');

        // Check if user is a participant
        $isParticipant = $chat->participants()->where('user_id', $user->id)->exists();
        if (!$isParticipant) {
            return response()->json(['message' => 'Bu sohbete erişim yetkiniz yok.'], 403);
        }

        $isOwner = $chat->created_by === $user->id;

        if (!$isOwner && !$isAdmin && !$hasDeletePermission) {
            return response()->json(['message' => 'Sohbeti silme yetkiniz bulunmamaktadır.'], 403);
        }

        // Delete all attachments in the chat from S3
        $fileService = app(\App\Modules\Chat\Services\FileService::class);
        $messagesWithAttachments = $chat->messages()->has('attachments')->with('attachments')->get();
        foreach ($messagesWithAttachments as $msg) {
            foreach ($msg->attachments as $attachment) {
                $fileService->deleteAttachment($attachment);
            }
        }

        $chatId = $chat->id;
        $chat->delete();

        // Broadcast to all participants that the chat is deleted
        broadcast(new \App\Modules\Chat\Events\ChatDeleted($chatId, (string)auth()->id()));

        return response()->json(['success' => true, 'message' => 'Sohbet ve tüm dosyalar silindi.']);
    }

    /**
     * Add new participants to an existing chat.
     */
    public function addParticipants(Chat $chat, Request $request): JsonResponse
    {
        $request->validate([
            'participant_ids' => 'required|array',
            'participant_ids.*' => 'exists:users,id'
        ]);

        $user = $request->user();

        // Check if user is a participant
        $isParticipant = $chat->participants()->where('user_id', $user->id)->exists();
        if (!$isParticipant) {
            return response()->json(['message' => 'Bu sohbete erişim yetkiniz yok.'], 403);
        }

        // Only owner or admin can add participants to a group
        $isOwner = $chat->participants()->where('user_id', $user->id)->where('role', 'owner')->exists();
        $isAdmin = in_array($user->role, ['ADMIN', 'SUPER_ADMIN']);

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Sadece sohbet yöneticileri yeni üye ekleyebilir.'], 403);
        }

        $this->chatService->addParticipants($chat, $request->participant_ids);

        // System message
        $addedUsers = \App\Models\User::whereIn('id', $request->participant_ids)->pluck('name')->toArray();
        if (!empty($addedUsers)) {
            $addedNames = implode(', ', $addedUsers);
            $msg = "{$user->name}, {$addedNames} adlı kişileri gruba ekledi.";
            $this->messageService->sendMessage($chat, $msg, 'system');
        }

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcılar eklendi.',
            'data' => $chat->load('participants.user')
        ]);
    }

    /**
     * Remove a participant from the group chat.
     */
    public function removeParticipant(Chat $chat, string $userId, Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if user is a participant
        $isParticipant = $chat->participants()->where('user_id', $user->id)->exists();
        if (!$isParticipant) {
            return response()->json(['message' => 'Bu sohbete erişim yetkiniz yok.'], 403);
        }

        // Check permissions
        $isOwner = $chat->participants()->where('user_id', $user->id)->where('role', 'owner')->exists();
        $isAdmin = in_array($user->role, ['ADMIN', 'SUPER_ADMIN']);
        $isSelf = $user->id == $userId;

        if (!$isOwner && !$isAdmin && !$isSelf) {
            return response()->json(['message' => 'Sadece sohbet yöneticileri kişi çıkarabilir.'], 403);
        }

        $removedUser = \App\Models\User::find($userId);
        if (!$removedUser) {
            return response()->json(['message' => 'Kullanıcı bulunamadı.'], 404);
        }

        $chat->participants()->where('user_id', $userId)->delete();

        // System message
        if ($isSelf) {
            $msg = "{$user->name} gruptan ayrıldı.";
        } else {
            $msg = "{$user->name}, {$removedUser->name} adlı kişiyi gruptan çıkardı.";
        }
        $this->messageService->sendMessage($chat, $msg, 'system', ['removed_user_id' => $userId]);

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı gruptan çıkarıldı.',
            'data' => $chat->load('participants.user')
        ]);
    }

    /**
     * Show chat details with initial messages.
     */
    public function show(Chat $chat, Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['ADMIN', 'SUPER_ADMIN']);

        // Check if user is a participant
        $isParticipant = $chat->participants()->where('user_id', $user->id)->exists();
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

    /**
     * List all users in the tenant for chat selection.
     */
    public function listUsers(Request $request): JsonResponse
    {
        $users = \App\Models\User::where('tenant_id', $request->user()->tenant_id)
            ->where('id', '!=', $request->user()->id) // Don't list self if you want, but usually you don't start a chat with yourself this way
            ->select(['id', 'name', 'role'])
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }
}
