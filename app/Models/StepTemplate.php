<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StepTemplate extends Model
{
    protected $table = 'step_templates';

    protected $fillable = [
        'tenant_id', 'name',
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
