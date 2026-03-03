<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'tenant_id', 'job_id', 'category_id', 'title', 'amount', 'date', 'description', 'cash_register_id',
    ];

    protected $casts = [
        'date' => 'date',
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

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }

    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }
}
