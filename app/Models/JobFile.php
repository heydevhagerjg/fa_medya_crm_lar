<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobFile extends Model
{
    use SoftDeletes;
    protected $table = 'job_files';
    public $timestamps = false;

    protected $fillable = [
        'job_id', 'file_name', 'file_path', 'file_type', 'file_size', 'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function job()
    {
        return $this->belongsTo(JobCrm::class, 'job_id');
    }
}
