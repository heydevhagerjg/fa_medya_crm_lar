<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobFile extends Model
{
    use SoftDeletes, \App\Traits\HasTenantCache;

    protected $cacheModule = 'files';
    protected $relatedCacheModules = ['jobs'];

    protected static function booted()
    {
        static::deleted(function ($file) {
            $tenantId = $file->job?->tenant_id;
            if ($tenantId && $file->file_path && $disk = Tenant::getS3DiskForTenant($tenantId)) {
                $disk->delete($file->file_path);
            }
        });
    }


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
