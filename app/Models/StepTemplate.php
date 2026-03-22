<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StepTemplate extends Model
{
    use \App\Traits\BelongsToTenant;
    protected $table = 'step_templates';

    protected $fillable = [
        'name',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function defaultSteps()
    {
        return $this->hasMany(DefaultStep::class, 'template_id')->orderBy('order');
    }
}
