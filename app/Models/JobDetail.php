<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobDetail extends Model
{
    protected $table = 'job_details';

    protected $fillable = [
        'job_id', 'customer_requests', 'notes',
    ];

    public function job()
    {
        return $this->belongsTo(JobCrm::class, 'job_id');
    }
}
