<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantBackup extends Model
{
    protected $fillable = [
        'tenant_id',
        'filename',
        'path',
        'size',
        'status',
        'progress',
        'error',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
