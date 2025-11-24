<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Purchase;

final class Stock
{
    public static function current(): float
    {
        $totalPurchased = Purchase::query()->sum('quantity_kg');
        $totalSold = \App\Models\SaleItem::query()->sum('quantity_kg');

        return max(0, $totalPurchased - $totalSold);
    }

    public static function available(): float
    {
        return self::current();
    }
}
