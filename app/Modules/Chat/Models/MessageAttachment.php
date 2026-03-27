<?php

namespace App\Modules\Chat\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageAttachment extends Model
{
    protected $fillable = [
        'message_id',
        'file_name',
        'file_type',
        'file_size',
        's3_path',
        's3_url',
        'mime_type',
        'preview_url',
        'width',
        'height',
        'metadata',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'metadata' => 'json',
        'width' => 'integer',
        'height' => 'integer',
    ];

    /**
     * Parent message.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
