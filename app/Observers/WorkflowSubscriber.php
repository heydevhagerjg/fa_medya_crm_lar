<?php

namespace App\Observers;

use App\Services\WorkflowEngine;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Events\Dispatcher;

class WorkflowSubscriber
{
    protected $engine;

    public function __construct(WorkflowEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen('eloquent.created: *', [$this, 'handleCreated']);
        $events->listen('eloquent.updated: *', [$this, 'handleUpdated']);
        $events->listen('eloquent.deleted: *', [$this, 'handleDeleted']);
    }

    public function handleCreated($eventName, $data)
    {
        $model = $data[0] ?? null;
        if ($model && $this->isWorkflowModel($model)) {
            $this->engine->trigger($model, 'created');
        }
    }

    public function handleUpdated($eventName, $data)
    {
        $model = $data[0] ?? null;
        if ($model && $this->isWorkflowModel($model)) {
            $this->engine->trigger($model, 'updated');
            
            // Special events based on status change
            if ($model->wasChanged('status')) {
                $status = $model->getAttribute('status');
                $eventName = 'status_' . strtolower($status); // status_accepted, status_rejected etc
                $this->engine->trigger($model, $eventName);
            }
        }
    }

    public function handleDeleted($eventName, $data)
    {
        $model = $data[0] ?? null;
        if ($model && $this->isWorkflowModel($model)) {
            $this->engine->trigger($model, 'deleted');
        }
    }

    /**
     * Otomasyon kapsamındaki modellerin kontrolü.
     */
    protected function isWorkflowModel($model)
    {
        $allowed = [
            'App\Models\Customer',
            'App\Models\JobCrm',
            'App\Models\Proposal',
            'App\Models\Payment',
            'App\Models\Appointment',
            'App\Models\Expense',
            'App\Models\JobFile',
            'App\Models\User'
        ];
        return in_array(get_class($model), $allowed);
    }
}
