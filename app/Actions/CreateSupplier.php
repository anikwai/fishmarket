<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Supplier;

final readonly class CreateSupplier
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes): Supplier
    {
        return Supplier::query()->create($attributes);
    }
}

