<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'config',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customFields()
    {
        return $this->hasMany(CustomField::class)->orderBy('order');
    }

    public function jobs()
    {
        return $this->hasMany(JobCrm::class, 'service_id');
    }

    public function getConfigAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    public function setConfigAttribute($value)
    {
        $this->attributes['config'] = is_array($value) ? json_encode($value) : $value;
    }
}
