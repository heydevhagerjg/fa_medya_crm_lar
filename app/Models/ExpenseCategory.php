<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    use \App\Traits\BelongsToTenant;
    protected $table = 'expense_categories';

    protected $fillable = [
        'name',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'category_id');
    }
}
