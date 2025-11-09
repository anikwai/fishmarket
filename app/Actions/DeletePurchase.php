<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;

final readonly class DeletePurchase
{
    public function handle(Purchase $purchase): void
    {
        $purchase->delete();
    }
}
