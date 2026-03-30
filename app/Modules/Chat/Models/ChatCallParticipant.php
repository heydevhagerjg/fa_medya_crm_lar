<?php

namespace App\Modules\Chat\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatCallParticipant extends Model
{
    protected $fillable = [
        'call_session_id',
        'user_id',
        'status',
        'invited_at',
        'responded_at',
        'joined_at',
        'left_at',
    ];

    protected $casts = [
        'invited_at' => 'datetime',
        'responded_at' => 'datetime',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ChatCallSession::class, 'call_session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
