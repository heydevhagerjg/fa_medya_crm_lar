<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowAction extends Model
{
    protected $fillable = ['workflow_id', 'type', 'parameters'];

    protected $casts = [
        'parameters' => 'array'
    ];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }
}
