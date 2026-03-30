<?php

namespace App\Modules\Chat\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Events\ChatCallIncoming;
use App\Modules\Chat\Events\ChatCallSignal;
use App\Modules\Chat\Events\ChatCallUpdated;
use App\Modules\Chat\Models\Chat;
use App\Modules\Chat\Models\ChatCallSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatCallController extends Controller
{
    public function active(Chat $chat, Request $request): JsonResponse
    {
        $this->ensureParticipant($chat, (string) $request->user()->id);

        $call = ChatCallSession::where('chat_id', $chat->id)
            ->whereIn('status', ['ringing', 'active'])
            ->latest('created_at')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $call ? $this->serializeCall($call) : null,
        ]);
    }

    public function start(Chat $chat, Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureParticipant($chat, (string) $user->id);

        $request->validate([
            'type' => 'sometimes|in:audio',
        ]);

        $existing = ChatCallSession::where('chat_id', $chat->id)
            ->whereIn('status', ['ringing', 'active'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Bu sohbette zaten aktif veya çalan bir görüşme var.',
                'data' => $this->serializeCall($existing),
            ], 409);
        }

        $call = DB::transaction(function () use ($chat, $user, $request) {
            $call = ChatCallSession::create([
                'chat_id' => $chat->id,
                'tenant_id' => $chat->tenant_id,
                'started_by' => $user->id,
                'type' => $request->get('type', 'audio'),
                'status' => 'ringing',
                'started_at' => now(),
            ]);

            $participantIds = $chat->participants()->where('is_active', true)->pluck('user_id')->values();
            foreach ($participantIds as $participantId) {
                $isCaller = (string) $participantId === (string) $user->id;
                $call->participants()->create([
                    'user_id' => $participantId,
                    'status' => $isCaller ? 'joined' : 'invited',
                    'invited_at' => now(),
                    'responded_at' => $isCaller ? now() : null,
                    'joined_at' => $isCaller ? now() : null,
                ]);
            }

            return $call->fresh(['starter', 'participants.user']);
        });

        $targetUserIds = $call->participants
            ->pluck('user_id')
            ->filter(fn ($id) => (string) $id !== (string) $user->id)
            ->values()
            ->all();

        event(new ChatCallIncoming($call, $targetUserIds));
        event(new ChatCallUpdated($call));

        return response()->json([
            'success' => true,
            'data' => $this->serializeCall($call),
        ], 201);
    }

    public function accept(Chat $chat, ChatCallSession $call, Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureCallAccess($chat, $call, (string) $user->id);

        if (in_array($call->status, ['ended', 'cancelled', 'rejected'], true)) {
            return response()->json(['message' => 'Bu görüşme artık aktif değil.'], 409);
        }

        DB::transaction(function () use ($call, $user) {
            $call->participants()
                ->where('user_id', $user->id)
                ->update([
                    'status' => 'joined',
                    'responded_at' => now(),
                    'joined_at' => now(),
                ]);

            if ($call->status === 'ringing') {
                $call->update([
                    'status' => 'active',
                    'answered_at' => now(),
                ]);
            }
        });

        $call->refresh()->load(['starter', 'participants.user']);
        event(new ChatCallUpdated($call));

        return response()->json([
            'success' => true,
            'data' => $this->serializeCall($call),
        ]);
    }

    public function reject(Chat $chat, ChatCallSession $call, Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureCallAccess($chat, $call, (string) $user->id);

        if (in_array($call->status, ['ended', 'cancelled', 'rejected'], true)) {
            return response()->json(['success' => true, 'data' => $this->serializeCall($call)]);
        }

        DB::transaction(function () use ($call, $user) {
            $call->participants()
                ->where('user_id', $user->id)
                ->update([
                    'status' => 'rejected',
                    'responded_at' => now(),
                ]);

            $hasAnyJoined = $call->participants()->where('status', 'joined')->exists();
            $hasAnyInvited = $call->participants()->where('status', 'invited')->exists();

            if (!$hasAnyJoined && !$hasAnyInvited) {
                $call->update([
                    'status' => 'rejected',
                    'ended_at' => now(),
                    'ended_by' => $user->id,
                ]);
            }
        });

        $call->refresh()->load(['starter', 'participants.user']);
        event(new ChatCallUpdated($call));

        return response()->json([
            'success' => true,
            'data' => $this->serializeCall($call),
        ]);
    }

    public function end(Chat $chat, ChatCallSession $call, Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureCallAccess($chat, $call, (string) $user->id);

        if (in_array($call->status, ['ended', 'cancelled', 'rejected'], true)) {
            return response()->json(['success' => true, 'data' => $this->serializeCall($call)]);
        }

        DB::transaction(function () use ($call, $user) {
            $call->participants()
                ->where('user_id', $user->id)
                ->whereIn('status', ['joined', 'invited'])
                ->update([
                    'status' => 'left',
                    'responded_at' => now(),
                    'left_at' => now(),
                ]);

            $call->update([
                'status' => 'ended',
                'ended_at' => now(),
                'ended_by' => $user->id,
            ]);
        });

        $call->refresh()->load(['starter', 'participants.user']);
        event(new ChatCallUpdated($call));

        return response()->json([
            'success' => true,
            'data' => $this->serializeCall($call),
        ]);
    }

    public function signal(Chat $chat, ChatCallSession $call, Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureCallAccess($chat, $call, (string) $user->id);

        if (!in_array($call->status, ['ringing', 'active'], true)) {
            return response()->json(['message' => 'Aktif görüşme yok.'], 409);
        }

        $validated = $request->validate([
            'signal_type' => 'required|in:offer,answer,ice-candidate',
            'target_user_id' => 'nullable|string|exists:users,id',
            'payload' => 'required|array',
        ]);

        event(new ChatCallSignal(
            $call,
            (string) $user->id,
            $validated['target_user_id'] ?? null,
            $validated['signal_type'],
            $validated['payload']
        ));

        return response()->json(['success' => true]);
    }

    protected function ensureParticipant(Chat $chat, string $userId): void
    {
        $isParticipant = $chat->participants()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$isParticipant) {
            abort(403, 'Bu sohbete erişim yetkiniz yok.');
        }
    }

    protected function ensureCallAccess(Chat $chat, ChatCallSession $call, string $userId): void
    {
        if ((int) $call->chat_id !== (int) $chat->id) {
            abort(404, 'Görüşme bulunamadı.');
        }

        $exists = $call->participants()->where('user_id', $userId)->exists();
        if (!$exists) {
            abort(403, 'Bu görüşmeye erişim yetkiniz yok.');
        }
    }

    protected function serializeCall(ChatCallSession $call): array
    {
        $call->loadMissing(['starter', 'participants.user']);

        return [
            'id' => $call->id,
            'chat_id' => $call->chat_id,
            'status' => $call->status,
            'type' => $call->type,
            'started_by' => $call->started_by,
            'caller_name' => $call->starter?->name,
            'started_at' => $call->started_at?->toISOString(),
            'answered_at' => $call->answered_at?->toISOString(),
            'ended_at' => $call->ended_at?->toISOString(),
            'ended_by' => $call->ended_by,
            'participants' => $call->participants->map(fn ($p) => [
                'user_id' => $p->user_id,
                'status' => $p->status,
                'name' => $p->user?->name,
                'joined_at' => $p->joined_at?->toISOString(),
                'left_at' => $p->left_at?->toISOString(),
            ])->values(),
        ];
    }
}
