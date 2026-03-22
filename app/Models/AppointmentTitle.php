<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentTitle extends Model
{
    use HasFactory, \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'appointment_titles';
    protected $relatedCacheModules = ['appointments'];


    protected $fillable = [
        'name',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
