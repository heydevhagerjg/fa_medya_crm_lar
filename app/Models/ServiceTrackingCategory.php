<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceTrackingCategory extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'service_trackings';

    protected $fillable = [
        'name',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function trackings()
    {
        return $this->hasMany(ServiceTracking::class, 'category_id');
    }
}
