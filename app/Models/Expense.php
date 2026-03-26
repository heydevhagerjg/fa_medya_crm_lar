<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'expenses';

    protected static function booted()
    {
        static::deleted(function ($expense) {
            if ($expense->receipt_path && $disk = Tenant::getS3DiskForTenant($expense->tenant_id)) {
                $disk->delete($expense->receipt_path);
            }
        });
    }


    protected $fillable = [
        'job_id', 'category_id', 'title', 'amount', 'date', 'description', 'cash_register_id', 'receipt_path'
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
