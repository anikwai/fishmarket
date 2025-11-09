<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Customer;

final readonly class DeleteCustomer
{
    public function handle(Customer $customer): void
    {
        $customer->delete();
    }
}

