<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Proposal extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'proposals';
    protected $relatedCacheModules = ['jobs'];

    protected $fillable = [
        'uuid', 'customer_id', 'service_id', 'title', 'description', 
        'total_price', 'status', 'notes', 'customer_notes', 'sent_at', 'valid_until',
        'is_vat_included', 'vat_rate', 'subtotal', 'vat_amount'
    ];

    protected $casts = [
        'total_price'     => 'decimal:2',
        'subtotal'        => 'decimal:2',
        'vat_amount'      => 'decimal:2',
        'is_vat_included' => 'boolean',
        'vat_rate'        => 'integer',
        'sent_at'         => 'datetime',
        'valid_until'     => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($proposal) {
            if (empty($proposal->uuid)) {
                $proposal->uuid = (string) Str::uuid();
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(ProposalItem::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function revisionRequests()
    {
        return $this->hasMany(ProposalRevisionRequest::class);
    }

    public function installments()
    {
        return $this->hasMany(ProposalInstallment::class);
    }

    public function job()
    {
        return $this->hasOne(JobCrm::class, 'proposal_id');
    }
}
