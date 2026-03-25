<?php

namespace App\Observers;

use App\Services\WorkflowEngine;
use Illuminate\Database\Eloquent\Model;

class WorkflowObserver
{
    private $engine;

    public function __construct(WorkflowEngine $engine)
    {
        $this->engine = $engine;
    }

    public function created(Model $model)
    {
        $this->engine->trigger($model, 'created');
    }

    public function updated(Model $model)
    {
        $this->engine->trigger($model, 'updated');
    }

    public function deleted(Model $model)
    {
        $this->engine->trigger($model, 'deleted');
    }
}
