<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;

final readonly class CreatePurchase
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes): Purchase
    {
        return Purchase::query()->create($attributes);
    }
}

