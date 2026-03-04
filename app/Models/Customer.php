<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'phone', 'email', 'notes',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function jobs()
    {
        return $this->hasMany(JobCrm::class, 'customer_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'customer_id');
    }
}
