<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'payments';

    protected static function booted()
    {
        static::deleted(function ($payment) {
            if ($payment->receipt_path && $disk = Tenant::getS3DiskForTenant($payment->tenant_id)) {
                $disk->delete($payment->receipt_path);
            }
        });
    }


    protected $fillable = [
        'job_id', 'amount', 'payment_date', 'payment_type', 'description', 'cash_register_id', 'receipt_path',
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
