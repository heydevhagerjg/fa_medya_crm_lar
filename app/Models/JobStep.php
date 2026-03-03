<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobStep extends Model
{
    protected $table = 'job_steps';

    protected $fillable = [
        'job_id', 'title', 'is_completed', 'order',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
    ];

    public function job()
    {
        return $this->belongsTo(JobCrm::class, 'job_id');
    }
}
