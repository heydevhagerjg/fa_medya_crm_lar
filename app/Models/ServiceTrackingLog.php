<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceTrackingLog extends Model
{
    protected $fillable = [
        'tenant_id',
        'service_tracking_id',
        'planned_date',
        'completed_at',
        'status',
        'notes'
    ];

    protected $casts = [
        'planned_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function serviceTracking()
    {
        return $this->belongsTo(ServiceTracking::class);
    }
}
