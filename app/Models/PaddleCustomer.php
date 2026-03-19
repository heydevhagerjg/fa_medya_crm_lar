<?php

namespace App\Models;

use Laravel\Paddle\Customer as CashierCustomer;

class PaddleCustomer extends CashierCustomer
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'paddle_customers';
}
