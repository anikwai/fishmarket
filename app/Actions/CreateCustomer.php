<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Customer;

final readonly class CreateCustomer
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes): Customer
    {
        return Customer::query()->create($attributes);
    }
}

