<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'tenant_id', 'job_id', 'amount', 'payment_date', 'payment_type', 'description', 'cash_register_id',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function job()
    {
        return $this->belongsTo(JobCrm::class, 'job_id');
    }

    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }
}
