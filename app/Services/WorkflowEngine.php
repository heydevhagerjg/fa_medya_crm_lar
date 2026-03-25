<?php

namespace App\Services;

use App\Models\Workflow;
use App\Models\WorkflowLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;

class WorkflowEngine
{
    /**
     * Otomasyonu tetikle.
     */
    public function trigger(Model $model, string $event)
    {
        $className = get_class($model);

        $workflows = Workflow::where('trigger_model', $className)
            ->where('trigger_event', $event)
            ->where('is_active', true)
            ->where('tenant_id', $model->tenant_id)
            ->with(['conditions', 'actions'])
            ->get();

        foreach ($workflows as $workflow) {
            if ($this->checkConditions($model, $workflow->conditions)) {
                $this->executeActions($model, $workflow);
            }
        }
    }

    /**
     * Koşulları kontrol et.
     */
    private function checkConditions($model, $conditions)
    {
        if ($conditions->isEmpty()) return true;

        foreach ($conditions as $condition) {
            $value = $model->getAttribute($condition->field);
            
            switch ($condition->operator) {
                case '=': if ($value != $condition->value) return false; break;
                case '!=': if ($value == $condition->value) return false; break;
                case '>': if ($value <= $condition->value) return false; break;
                case '<': if ($value >= $condition->value) return false; break;
                case 'contains': if (!str_contains($value, $condition->value)) return false; break;
                case 'not_contains': if (str_contains($value, $condition->value)) return false; break;
                case 'empty': if (!empty($value)) return false; break;
                case 'not_empty': if (empty($value)) return false; break;
            }
        }

        return true;
    }

    /**
     * Aksiyonları çalıştır.
     */
    private function executeActions(Model $model, Workflow $workflow)
    {
        $actionsTaken = [];
        $status = 'success';
        $details = 'Otomasyon başarıyla tamamlandı.';

        foreach ($workflow->actions as $action) {
            try {
                $result = null;
                switch ($action->type) {
                    case 'send_email':
                        $result = $this->handleSendEmail($model, $action->parameters);
                        break;
                    case 'change_status':
                        $result = $this->handleChangeStatus($model, $action->parameters);
                        break;
                    case 'assign_to_user':
                        $result = $this->handleAssignToUser($model, $action->parameters);
                        break;
                    case 'create_job':
                        $result = $this->handleCreateJob($model, $action->parameters);
                        break;
                    case 'log_activity':
                        $result = $this->handleLogActivity($model, $action->parameters);
                        break;
                    case 'create_task':
                        $result = $this->handleCreateTask($model, $action->parameters);
                        break;
                    case 'create_appointment':
                        $result = $this->handleCreateAppointment($model, $action->parameters);
                        break;
                    case 'send_webhook':
                        $result = $this->handleSendWebhook($model, $action->parameters);
                        break;
                    case 'add_note':
                        $result = $this->handleAddNote($model, $action->parameters);
                        break;
                }
                $actionsTaken[] = [
                    'type' => $action->type,
                    'status' => 'success',
                    'result' => $result
                ];
            } catch (\Exception $e) {
                $status = 'fail';
                $details = "Hata: " . $e->getMessage();
                $actionsTaken[] = [
                    'type' => $action->type,
                    'status' => 'fail',
                    'error' => $e->getMessage()
                ];
                Log::error("Workflow Engine Action Error: " . $e->getMessage());
            }
        }

        // Workflow Log Kaydı
        WorkflowLog::create([
            'tenant_id' => $model->tenant_id,
            'workflow_id' => $workflow->id,
            'workflow_name' => $workflow->name,
            'trigger_model' => class_basename($model),
            'trigger_event' => $workflow->trigger_event,
            'model_id' => $model->id,
            'actions_taken' => $actionsTaken,
            'status' => $status,
            'details' => $details
        ]);
    }

    /**
     * Mail gönderme aksiyonu.
     */
    private function handleSendEmail(Model $model, array $parameters)
    {
        $to = $this->replaceVariables($parameters['to'] ?? '', $model);
        $subject = $this->replaceVariables($parameters['subject'] ?? ' CRM Bildirimi', $model);
        $body = $this->replaceVariables($parameters['body'] ?? '', $model);

        if (!empty($to)) {
            Mail::raw($body, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });
            return "Email sent to $to";
        }
        return "No email address found";
    }

    /**
     * Kayıt durumunu güncelleme aksiyonu.
     */
    private function handleChangeStatus(Model $model, array $parameters)
    {
        $field = $parameters['field'] ?? 'status';
        $newValue = $parameters['value'] ?? null;

        if ($newValue !== null && $model->isFillable($field)) {
            $model->update([$field => $newValue]);
            return "Updated $field to $newValue";
        }
        return "Could not update status";
    }

    /**
     * Kullanıcı atama aksiyonu.
     */
    private function handleAssignToUser(Model $model, array $parameters)
    {
        $userId = $parameters['user_id'] ?? null;
        if ($userId && $model->isFillable('user_id')) {
            $model->update(['user_id' => $userId]);
            return "Assigned to user ID $userId";
        }
        return "User assignment failed";
    }

    /**
     * Tekliften iş oluşturma aksiyonu (Sadece Proposal için).
     */
    private function handleCreateJob(Model $model, array $parameters)
    {
        if (!($model instanceof \App\Models\Proposal)) {
            return "Model is not a Proposal";
        }

        if ($model->job()->count() > 0) {
            return "Job already exists";
        }

        $jobStatus = \App\Models\JobStatus::where('tenant_id', $model->tenant_id)->orderBy('order')->first();
        if (!$jobStatus) return "No job status found";

        $job = \App\Models\JobCrm::create([
            'tenant_id'       => $model->tenant_id,
            'customer_id'     => $model->customer_id,
            'service_id'      => $model->service_id,
            'proposal_id'     => $model->id,
            'job_status_id'   => $jobStatus->id,
            'title'           => $model->title,
            'description'     => $model->description,
            'status'          => 'PENDING',
            'total_price'     => $model->total_price,
            'is_vat_included' => $model->is_vat_included,
            'vat_rate'        => $model->vat_rate,
            'subtotal'        => $model->subtotal,
            'vat_amount'      => $model->vat_amount,
            'start_date'      => now(),
        ]);

        \App\Models\JobDetail::create([
            'job_id' => $job->id,
            'notes' => "İş otomasyonu tarafından oluşturuldu.",
        ]);

        $model->installments()->update(['job_id' => $job->id]);
        return "Job created with ID " . $job->id;
    }

    /**
     * Görev oluşturma (JobStep).
     */
    private function handleCreateTask(Model $model, array $parameters)
    {
        $jobId = null;
        if ($model instanceof \App\Models\JobCrm) $jobId = $model->id;
        elseif ($model->hasAttribute('job_id')) $jobId = $model->job_id;
        elseif ($model->job) $jobId = $model->job->id;

        if (!$jobId) return "No linked Job found for task";

        $title = $this->replaceVariables($parameters['title'] ?? 'Yeni Görev', $model);
        
        \App\Models\JobStep::create([
            'job_id' => $jobId,
            'title' => $title,
            'is_completed' => false,
            'order' => $parameters['order'] ?? 0
        ]);

        return "Task created for job $jobId";
    }

    /**
     * Randevu oluşturma.
     */
    private function handleCreateAppointment(Model $model, array $parameters)
    {
        $customerId = $model->customer_id ?? ($model instanceof \App\Models\Customer ? $model->id : null);
        if (!$customerId) return "No customer found for appointment";

        $title = $this->replaceVariables($parameters['title'] ?? 'Otomasyon Randevusu', $model);
        $offsetDays = (int)($parameters['offset_days'] ?? 0);
        $date = now()->addDays($offsetDays)->toDateString();
        $time = $parameters['time'] ?? '09:00';

        $appointment = \App\Models\Appointment::create([
            'tenant_id' => $model->tenant_id,
            'customer_id' => $customerId,
            'title' => $title,
            'appointment_date' => $date,
            'appointment_time' => $time,
            'duration' => $parameters['duration'] ?? 30,
            'status' => 'PENDING'
        ]);

        return "Appointment created ID " . $appointment->id;
    }

    /**
     * Webhook gönderimi.
     */
    private function handleSendWebhook(Model $model, array $parameters)
    {
        $url = $parameters['url'] ?? null;
        if (!$url) return "Webhook URL missing";

        $payload = $model->toArray();
        $response = Http::post($url, $payload);

        return "Webhook sent. Response Status: " . ($response->successful() ? 'OK' : 'Error');
    }

    /**
     * Not ekleme.
     */
    private function handleAddNote(Model $model, array $parameters)
    {
        $content = $this->replaceVariables($parameters['content'] ?? '', $model);
        if (empty($content)) return "Content is empty";

        // CRM'de 'notes' her modelde yoksa JobDetail gibi yerlere eklenebilir.
        // Şimdilik ActivityLog'a özel bir not olarak ekliyoruz.
        \App\Services\ActivityLogService::log(
            null,
            'NOTE',
            strtoupper(class_basename($model)),
            $model->id,
            null,
            "NOT: " . $content,
            $model->tenant_id
        );

        return "Note added to activity log";
    }

    /**
     * Aktivite logu kaydetme (Kısa).
     */
    private function handleLogActivity(Model $model, array $parameters)
    {
        $description = $this->replaceVariables($parameters['description'] ?? 'Otomasyon çalıştı.', $model);

        \App\Services\ActivityLogService::log(
            null,
            $parameters['type'] ?? 'SYSTEM',
            strtoupper(class_basename($model)),
            $model->id,
            $model->title ?? $model->name ?? 'N/A',
            $description,
            $model->tenant_id
        );

        return "Activity log recorded";
    }

    /**
     * Değişkenleri yer değiştirme ({id}, {title} vb.).
     */
    private function replaceVariables(string $text, Model $model)
    {
        foreach ($model->toArray() as $key => $val) {
            if (is_scalar($val)) {
                $text = str_replace('{' . $key . '}', (string)$val, $text);
            }
        }
        
        // Relation based variables
        if ($model->customer) {
            $text = str_replace('{customer_name}', $model->customer->name, $text);
        }

        return $text;
    }
}
