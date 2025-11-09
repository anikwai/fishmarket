<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;

final readonly class UpdatePurchase
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Purchase $purchase, array $attributes): void
    {
        $purchase->update($attributes);
    }
}
