<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobStatus extends Model
{
    protected $table = 'job_statuses';

    protected $fillable = [
        'tenant_id', 'name', 'color', 'order',
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
