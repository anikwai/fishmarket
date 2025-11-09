<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final readonly class PreparePurchaseIndexDataAction
{
    public function handle(LengthAwarePaginator $purchases, ?string $sortBy = null, ?string $sortDir = null): LengthAwarePaginator
    {
        // Calculate profit for each purchase
        $purchases->getCollection()->transform(function (Purchase $purchase): Purchase {
            // Load sales relationship with pivot data
            $purchase->load(['sales' => function ($query): void {
                $query->withPivot('quantity_kg');
            }, 'expenses']);

            return $purchase;
        });

        // Sort by profit if needed (after calculation)
        if ($sortBy === 'profit' && in_array($sortDir, ['asc', 'desc'])) {
            $purchases->getCollection()->sortBy(fn (Purchase $purchase): float => (float) ($purchase->profit ?? 0), SORT_REGULAR, $sortDir === 'desc');
        }

        return $purchases;
    }
}
