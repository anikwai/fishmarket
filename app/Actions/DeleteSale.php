<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;

final readonly class DeleteSale
{
    public function handle(Sale $sale): void
    {
        $sale->delete();
    }
}

