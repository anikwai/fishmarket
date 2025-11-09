<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Purchase;
use App\Models\Sale;

final class Stock
{
    public static function current(): float
    {
        $totalPurchased = Purchase::sum('quantity_kg');
        $totalSold = Sale::sum('quantity_kg');

        return max(0, $totalPurchased - $totalSold);
    }

    public static function available(): float
    {
        return self::current();
    }
}

