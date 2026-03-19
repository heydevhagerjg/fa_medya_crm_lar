<?php

namespace App\Models;

use Laravel\Paddle\Customer as CashierCustomer;

class BillingCustomer extends CashierCustomer
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'billing_customers';
}
