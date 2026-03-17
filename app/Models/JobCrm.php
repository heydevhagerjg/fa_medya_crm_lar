<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCrm extends Model
{
    protected $table = 'jobs_crm';

    protected $fillable = [
        'tenant_id', 'user_id', 'customer_id', 'service_id', 'job_status_id',
        'title', 'description', 'status', 'start_date', 'end_date', 'total_price', 'order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_price' => 'decimal:2',
    ];

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function jobStatus()
    {
        return $this->belongsTo(JobStatus::class);
    }

    public function jobDetail()
    {
        return $this->hasOne(JobDetail::class, 'job_id');
    }

    public function jobFiles()
    {
        return $this->hasMany(JobFile::class, 'job_id');
    }

    public function jobSteps()
    {
        return $this->hasMany(JobStep::class, 'job_id')->orderBy('order');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'job_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'job_id');
    }

    public function customFieldValues()
    {
        return $this->hasMany(CustomFieldValue::class, 'job_id');
    }
}
