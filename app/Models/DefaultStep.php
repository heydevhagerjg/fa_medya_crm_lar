<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefaultStep extends Model
{
    protected $table = 'default_steps';

    protected $fillable = [
        'tenant_id', 'template_id', 'title', 'order',
    ];

    public function template()
    {
        return $this->belongsTo(StepTemplate::class, 'template_id');
    }
}
