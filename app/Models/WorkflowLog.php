<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowLog extends Model
{
    protected $table = 'workflow_logs';

    protected $fillable = [
        'tenant_id',
        'workflow_id',
        'workflow_name',
        'trigger_model',
        'trigger_event',
        'model_id',
        'actions_taken',
        'status',
        'details'
    ];

    protected $casts = [
        'actions_taken' => 'array'
    ];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }
}
