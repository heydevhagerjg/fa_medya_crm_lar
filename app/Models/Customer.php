<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'customers';
    protected $relatedCacheModules = ['jobs'];

    protected $fillable = [
        'name', 'phone', 'email', 'notes',
    ];

    protected $appends = ['formatted_phone'];

    public function getFormattedPhoneAttribute()
    {
        if (!$this->phone) return '-';
        $cleaned = preg_replace('/\D/', '', $this->phone);
        if (strlen($cleaned) === 11 && strpos($cleaned, '0') === 0) {
            $cleaned = substr($cleaned, 1);
        }
        if (strlen($cleaned) === 10) {
            $cleaned = '90' . $cleaned;
        }
        if (preg_match('/^(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})$/', $cleaned, $matches)) {
            return "+{$matches[1]} {$matches[2]} {$matches[3]} {$matches[4]} {$matches[5]}";
        }

        if (strlen($cleaned) > 10) {
            return '+' . $cleaned;
        }

        return $this->phone;
    }

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

    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'customer_id');
    }
}
