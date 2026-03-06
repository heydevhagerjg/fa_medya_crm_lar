<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiKey extends Model
{
    protected $table = 'api_keys';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'key', 'name', 'tenant_id', 'last_used', 'permissions', 'expires_at',
    ];

    protected $casts = [
        'last_used' => 'datetime',
        'expires_at' => 'datetime',
        'permissions' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
