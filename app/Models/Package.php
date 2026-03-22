<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Package extends Model
{
    protected $fillable = [
        'name',
        'price',
        'trial_days',
        'paddle_product_id',
        'paddle_price_id',
        'personnel_limit',
        'customer_limit',
        'job_limit',
        'appointment_feature',
        'appointment_limit',
        'service_tracking_feature',
        'service_tracking_limit',
        'service_tracking_category_feature',
        'service_tracking_category_limit',
        'proposal_feature',
        'proposal_limit',
        'backup_feature',
        'backup_limit',
        'services_section_feature',
        'service_limit',
        'step_templates_feature',
        'step_template_limit',
        'cash_register_limit',
        'api_key_feature',
        'disk_usage_limit',
        'single_file_limit',
        'is_active',
        'is_popular',
    ];

    protected $casts = [
        'appointment_feature' => 'boolean',
        'service_tracking_feature' => 'boolean',
        'service_tracking_category_feature' => 'boolean',
        'proposal_feature' => 'boolean',
        'backup_feature' => 'boolean',
        'services_section_feature' => 'boolean',
        'step_templates_feature' => 'boolean',
        'api_key_feature' => 'boolean',
        'is_active' => 'boolean',
        'is_popular' => 'boolean',
        'disk_usage_limit' => 'integer',
        'single_file_limit' => 'integer',
    ];

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function isFree(): bool
    {
        return $this->price <= 0 || (empty($this->paddle_product_id) && empty($this->paddle_price_id));
    }
}
