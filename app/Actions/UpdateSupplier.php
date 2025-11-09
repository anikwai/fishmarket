<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Supplier;

final readonly class UpdateSupplier
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Supplier $supplier, array $attributes): void
    {
        $supplier->update($attributes);
    }
}

