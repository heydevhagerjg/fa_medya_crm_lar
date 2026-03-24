<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Paddle\Billable;
use App\Traits\HasPlanLimits;

class Tenant extends Model
{
    use HasPlanLimits, Billable;

    protected static function booted()
    {
        static::deleting(function ($tenant) {
            // Delete S3 files first!
            try {
                $tenant->deleteS3Folder();
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("S3 Cleanup Error for Tenant {$tenant->id}: " . $e->getMessage());
            }

            // Delete all associated records to ensure clean database
            $tenant->users()->each(fn($u) => $u->delete());
            $tenant->customers()->each(fn($c) => $c->delete());
            $tenant->jobs()->each(fn($j) => $j->delete());
            $tenant->services()->each(fn($s) => $s->delete());
            $tenant->jobStatuses()->each(fn($js) => $js->delete());
            $tenant->stepTemplates()->each(fn($st) => $st->delete());
            $tenant->payments()->each(fn($p) => $p->delete());
            $tenant->expenses()->each(fn($e) => $e->delete());
            $tenant->expenseCategories()->each(fn($ec) => $ec->delete());
            $tenant->cashRegisters()->each(fn($cr) => $cr->delete());
            $tenant->apiKeys()->each(fn($ak) => $ak->delete());
            $tenant->activityLogs()->each(fn($al) => $al->delete());
        });
    }

    /**
     * Delete the entire S3 folder for this tenant
     */
    public function deleteS3Folder()
    {
        if (!$this->s3_config_id) return;

        $s3Config = $this->s3Config;
        if (!$s3Config) return;

        // Temporarily configure disk
        config(['filesystems.disks.s3_cleanup' => [
            'driver' => 's3',
            'key' => trim($s3Config->aws_access_key_id),
            'secret' => trim($s3Config->aws_secret_access_key),
            'region' => trim($s3Config->aws_region),
            'bucket' => trim($s3Config->aws_bucket_name),
            'use_path_style_endpoint' => false,
            'throw' => false
        ]]);

        $disk = \Illuminate\Support\Facades\Storage::disk('s3_cleanup');
        $folder = "tenants/{$this->id}";

        if ($disk->exists($folder)) {
            $disk->deleteDirectory($folder);
        }
    }

    /**
     * Safely get a configured S3 disk for a specific tenant ID.
     * Useful for background/model-event cleanup tasks.
     */
    public static function getS3DiskForTenant(string $tenantId)
    {
        $tenant = self::with('s3Config')->find($tenantId);
        if (!$tenant || !$tenant->s3Config) return null;

        $config = $tenant->s3Config;
        $diskName = "tenant_s3_cleanup_" . str_replace('-', '_', $tenantId);
        
        if (!config("filesystems.disks.{$diskName}")) {
            config(["filesystems.disks.{$diskName}" => [
                'driver' => 's3',
                'key' => trim($config->aws_access_key_id),
                'secret' => trim($config->aws_secret_access_key),
                'region' => trim($config->aws_region),
                'bucket' => trim($config->aws_bucket_name),
                'use_path_style_endpoint' => false,
                'throw' => false
            ]]);
        }

        return \Illuminate\Support\Facades\Storage::disk($diskName);
    }

    protected $fillable = [
        'id', 'name', 'slug', 'storage_used', 'logo', 's3_config_id', 'package_id', 'trial_ends_at', 'is_gifted',
        'is_active', 'suspension_message', 'is_restoring', 'backup_requested',
        'plan_personnel_limit', 'plan_customer_limit', 'plan_job_limit',
        'plan_appointment_feature', 'plan_appointment_limit',
        'plan_service_tracking_feature', 'plan_service_tracking_limit', 'plan_service_tracking_category_feature', 'plan_service_tracking_category_limit',
        'plan_proposal_feature', 'plan_proposal_limit',
        'plan_backup_feature', 'plan_backup_limit',
        'plan_services_section_feature', 'plan_service_limit',
        'plan_step_templates_feature', 'plan_step_template_limit',
        'plan_cash_register_limit', 'plan_api_key_feature', 'plan_disk_usage_limit', 'plan_single_file_limit'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'plan_appointment_feature' => 'boolean',
        'plan_service_tracking_feature' => 'boolean',
        'plan_service_tracking_category_feature' => 'boolean',
        'plan_proposal_feature' => 'boolean',
        'plan_backup_feature' => 'boolean',
        'plan_services_section_feature' => 'boolean',
        'plan_step_templates_feature' => 'boolean',
        'plan_api_key_feature' => 'boolean',
        'plan_disk_usage_limit' => 'integer',
        'plan_single_file_limit' => 'integer',
        'storage_used' => 'integer',
        'trial_ends_at' => 'datetime',
        'is_gifted' => 'boolean',
        'is_restoring' => 'boolean',
        'backup_requested' => 'boolean',
    ];

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function applyPackage(Package $package)
    {
        $this->update([
            'package_id' => $package->id,
            'plan_personnel_limit' => $package->personnel_limit,
            'plan_customer_limit' => $package->customer_limit,
            'plan_job_limit' => $package->job_limit,
            'plan_appointment_feature' => $package->appointment_feature,
            'plan_appointment_limit' => $package->appointment_limit,
            'plan_service_tracking_feature' => $package->service_tracking_feature,
            'plan_service_tracking_limit' => $package->service_tracking_limit,
            'plan_service_tracking_category_feature' => $package->service_tracking_category_feature,
            'plan_service_tracking_category_limit' => $package->service_tracking_category_limit,
            'plan_proposal_feature' => $package->proposal_feature,
            'plan_proposal_limit' => $package->proposal_limit,
            'plan_backup_feature' => $package->backup_feature,
            'plan_backup_limit' => $package->backup_limit,
            'plan_services_section_feature' => $package->services_section_feature,
            'plan_service_limit' => $package->service_limit,
            'plan_step_templates_feature' => $package->step_templates_feature,
            'plan_step_template_limit' => $package->step_template_limit,
            'plan_cash_register_limit' => $package->cash_register_limit,
            'plan_api_key_feature' => $package->api_key_feature,
            'plan_disk_usage_limit' => $package->disk_usage_limit,
            'plan_single_file_limit' => $package->single_file_limit,
        ]);
    }

    /**
     * Get the billable's email address.
     * Required for Laravel Cashier Paddle v2+.
     */
    public function paddleEmail(): ?string
    {
        // Use the email of the first user of this tenant as the billing email
        return $this->users()->orderBy('created_at')->first()?->email;
    }

    /**
     * Get the billable's name.
     */
    public function paddleName(): ?string
    {
        return $this->name;
    }

    public function onTrial($params = [])
    {
        if ($this->is_gifted) return true;
        
        $trialEndsAt = $this->trialEndsAt($params);
        return $trialEndsAt && $trialEndsAt->isFuture();
    }

    public function trialEndsAt($params = [])
    {
        return $this->trial_ends_at;
    }

    public function s3Config()
    {
        return $this->belongsTo(S3Config::class, 's3_config_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(JobCrm::class, 'tenant_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function jobStatuses(): HasMany
    {
        return $this->hasMany(JobStatus::class);
    }

    public function stepTemplates(): HasMany
    {
        return $this->hasMany(StepTemplate::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function expenseCategories(): HasMany
    {
        return $this->hasMany(ExpenseCategory::class);
    }

    public function cashRegisters(): HasMany
    {
        return $this->hasMany(CashRegister::class);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
