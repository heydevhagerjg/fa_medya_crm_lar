<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class Workflow extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'name', 'trigger_model', 'trigger_event', 'is_active'];

    public function conditions()
    {
        return $this->hasMany(WorkflowCondition::class);
    }

    public function actions()
    {
        return $this->hasMany(WorkflowAction::class);
    }
}
