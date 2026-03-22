<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceTracking extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasTenantCache;

    protected $cacheModule = 'service_trackings';

    protected $fillable = [
        'category_id',
        'customer_id',
        'job_id',
        'title',
        'description',
        'period',
        'period_unit',
        'start_date',
        'next_date',
        'status',
    ];

    protected static function booted()
    {
        static::addGlobalScope('active', function ($builder) {
            $builder->where('status', 'active');
        });
    }

    protected $casts = [
        'start_date' => 'date',
        'next_date' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category()
    {
        return $this->belongsTo(ServiceTrackingCategory::class, 'category_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function job()
    {
        return $this->belongsTo(JobCrm::class, 'job_id');
    }

    public function logs()
    {
        return $this->hasMany(ServiceTrackingLog::class, 'service_tracking_id');
    }

    /**
     * Returns a list of dates that should have occurred but are not logged.
     */
    public function getMissedDates()
    {
        $today = now()->startOfDay();
        $current = \Carbon\Carbon::parse($this->next_date)->startOfDay();
        
        $missed = [];
        
        // We only care if the NEXT planned date is in the past
        while ($current->lt($today)) {
            // Check if this date is already logged
            $exists = $this->logs()->where('planned_date', $current->toDateString())->exists();
            if (!$exists) {
                $missed[] = $current->toDateString();
            }
            
            // Move to next occurrence
            $current = $this->addPeriod($current, $this->period, $this->period_unit);
        }
        
        return $missed;
    }

    private function addPeriod($date, $period, $unit)
    {
        $d = clone $date;
        switch ($unit) {
            case 'day': return $d->addDays($period);
            case 'week': return $d->addWeeks($period);
            case 'month': return $d->addMonths($period);
            case 'year': return $d->addYears($period);
        }
        return $d;
    }
}
