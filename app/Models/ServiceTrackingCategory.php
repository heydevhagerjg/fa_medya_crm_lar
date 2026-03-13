<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceTrackingCategory extends Model
{
    protected $fillable = [
        'tenant_id', 'name',
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
