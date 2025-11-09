<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Customer;

final readonly class UpdateCustomer
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Customer $customer, array $attributes): void
    {
        $customer->update($attributes);
    }
}
