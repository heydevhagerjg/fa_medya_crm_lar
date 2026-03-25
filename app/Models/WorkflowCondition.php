<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowCondition extends Model
{
    protected $fillable = ['workflow_id', 'field', 'operator', 'value'];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }
}
