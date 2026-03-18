<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProposalInstallment extends Model
{
    use HasFactory;

    protected $fillable = [
        'proposal_id', 'job_id', 'amount', 'percentage', 'payment_date', 'description', 'is_paid', 'paid_at'
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'percentage'   => 'decimal:2',
        'payment_date' => 'date',
        'is_paid'      => 'boolean',
        'paid_at'      => 'datetime',
    ];

    public function proposal()
    {
        return $this->belongsTo(Proposal::class);
    }

    public function job()
    {
        return $this->belongsTo(JobCrm::class, 'job_id');
    }
}
