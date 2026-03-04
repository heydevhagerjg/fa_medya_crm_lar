<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupKey extends Model
{
    protected $fillable = ['tenant_id', 'key', 'name'];
}
