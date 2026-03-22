<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobStatus extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'jobs'; // Status changes affect job lists

    protected $table = 'job_statuses';

    protected $fillable = [
        'name', 'color', 'order',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function jobs()
    {
        return $this->hasMany(JobCrm::class, 'job_status_id');
    }
}
