<?php

namespace App\Traits;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

trait HasPlanLimits
{
    /**
     * Check if a specific feature is enabled for the tenant.
     */
    public function hasFeature(string $feature): bool
    {
        // Core features that are always enabled but have limits
        $coreFeatures = ['personnel', 'customer', 'job', 'cash_register', 'service', 'step_template'];
        if (in_array($feature, $coreFeatures)) {
            return true;
        }

        $field = 'plan_' . $feature . '_feature';
        return (bool) ($this->{$field} ?? false);
    }

    /**
     * Check if the tenant has reached a specific limit.
     */
    public function reachedLimit(string $resource): bool
    {
        $limitField = 'plan_' . $resource . '_limit';
        
        // If the limit field doesn't exist on the model (e.g. binary features), it's not limited by count
        if (!isset($this->attributes[$limitField]) && !isset($this->{$limitField})) {
            return false;
        }

        $limit = $this->{$limitField};
        
        // If limit is 0 or null, it's unlimited
        if ($limit === 0 || $limit === null) {
            return false;
        }
        
        $count = $this->getResourceCount($resource);

        return $count >= $limit;
    }

    /**
     * Get the current count of a resource.
     */
    public function getResourceCount(string $resource): int
    {
        return match ($resource) {
            'personnel' => $this->users()->count(),
            'customer' => $this->customers()->count(),
            'job' => $this->jobs()->count(),
            'appointment' => DB::table('appointments')->where('tenant_id', $this->id)->count(),
            'service_tracking' => DB::table('service_trackings')->where('tenant_id', $this->id)->count(),
            'service' => $this->services()->count(),
            'step_template' => $this->stepTemplates()->count(),
            'cash_register' => $this->cashRegisters()->count(),
            'proposal' => DB::table('proposals')->where('tenant_id', $this->id)->count(),
            'backup' => DB::table('backup_keys')->where('tenant_id', $this->id)->count(),
            'service_tracking_category' => DB::table('service_tracking_categories')->where('tenant_id', $this->id)->count(),
            default => 0,
        };
    }

    /**
     * Check disk usage limit.
     */
    public function reachedDiskLimit(): bool
    {
        if ($this->plan_disk_usage_limit === 0) {
            return false;
        }
        
        // storage_used is in bytes, plan_disk_usage_limit is in MB
        return $this->storage_used >= ($this->plan_disk_usage_limit * 1024 * 1024);
    }

    /**
     * Check if a file of a given size can be uploaded.
     */
    public function canUploadFile(int $fileSizeInBytes): bool
    {
        if ($this->plan_disk_usage_limit === 0) {
            return true;
        }

        $projectedUsage = $this->storage_used + $fileSizeInBytes;
        return $projectedUsage <= ($this->plan_disk_usage_limit * 1024 * 1024);
    }

    public function getFeatureLabel(string $feature): string
    {
        return match ($feature) {
            'personnel' => 'Personel',
            'customer' => 'Müşteri',
            'job' => 'İş',
            'appointment' => 'Randevu',
            'service_tracking' => 'Hizmet Takibi',
            'service' => 'Hizmet',
            'step_template' => 'Adım Şablonu',
            'cash_register' => 'Kasa',
            'proposal' => 'Teklif',
            'backup' => 'Yedekleme',
            'api_key' => 'API Anahtarı',
            'service_tracking_category' => 'Hizmet Takip Kategorisi',
            default => $feature,
        };
    }

    public function getLimitValue(string $resource): int
    {
        return (int) ($this->{'plan_' . $resource . '_limit'} ?? 0);
    }
}
