<?php

namespace App\Modules\Chat\Models;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Chat extends Model
{
    protected $fillable = [
        'tenant_id',
        'chateable_type',
        'chateable_id',
        'name',
        'description',
        'icon',
        'is_archived',
        'is_pinned',
        'message_count',
        'created_by',
        'last_message_at',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'is_pinned' => 'boolean',
        'last_message_at' => 'datetime',
    ];

    /**
     * Cascade-delete related records when a chat is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (Chat $chat) {
            // Delete all message attachments first
            $chat->messages()->with('attachments')->get()->each(function ($message) {
                $message->attachments()->delete();
            });
            $chat->messages()->delete();
            $chat->participants()->delete();
        });
    }


    /**
     * Polymorphic relation to entity being chatted about.
     */
    public function chateable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Tenant relationship.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Creator relationship.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Participants relationship.
     */
    public function participants(): HasMany
    {
        return $this->hasMany(ChatParticipant::class);
    }

    /**
     * Get the last message of the chat.
     */
    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Messages relationship.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Voice call sessions of this chat.
     */
    public function callSessions(): HasMany
    {
        return $this->hasMany(ChatCallSession::class);
    }
}
