<?php

namespace App\Modules\Chat\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Tenant;

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

    protected $appends = ['url', 'preview_signed'];

    /**
     * Parent message.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Signed Proxy URL for the original file.
     */
    public function getUrlAttribute(): string
    {
        return \Illuminate\Support\Facades\URL::signedRoute('chats.attachment.proxy', ['id' => $this->id]);
    }

    /**
     * Signed Proxy URL FORCED for download.
     */
    public function getDownloadUrlAttribute(): string
    {
        return \Illuminate\Support\Facades\URL::signedRoute('chats.attachment.proxy', ['id' => $this->id, 'download' => 1]);
    }

    /**
     * Signed Proxy URL for the thumbnail.
     */
    public function getPreviewSignedAttribute(): ?string
    {
        if ($this->file_type !== 'image') return null;
        return \Illuminate\Support\Facades\URL::signedRoute('chats.attachment.proxy', ['id' => $this->id, 'preview' => 1]);
    }
}
