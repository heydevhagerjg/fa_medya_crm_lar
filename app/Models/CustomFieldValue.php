<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomFieldValue extends Model
{
    protected $table = 'custom_field_values';

    protected $fillable = [
        'job_id', 'custom_field_id', 'value',
    ];

    public function job()
    {
        return $this->belongsTo(JobCrm::class, 'job_id');
    }

    public function customField()
    {
        return $this->belongsTo(CustomField::class, 'custom_field_id');
    }
}
