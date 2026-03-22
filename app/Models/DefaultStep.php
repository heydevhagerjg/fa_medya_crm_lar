<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefaultStep extends Model
{
    use \App\Traits\BelongsToTenant;
    protected $table = 'default_steps';

    protected $fillable = [
        'template_id', 'title', 'order',
    ];

    public function template()
    {
        return $this->belongsTo(StepTemplate::class, 'template_id');
    }
}
