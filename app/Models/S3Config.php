<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class S3Config extends Model
{
    protected $table = 's3_configs';

    protected $fillable = [
        'name',
        'aws_access_key_id',
        'aws_secret_access_key',
        'aws_region',
        'aws_bucket_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
