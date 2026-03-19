<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProposalRevisionRequest extends Model
{
    protected $fillable = ['proposal_id', 'notes', 'status'];

    public function proposal()
    {
        return $this->belongsTo(Proposal::class);
    }
}
