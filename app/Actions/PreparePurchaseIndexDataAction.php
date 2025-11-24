<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as ConcretePaginator;

final readonly class PreparePurchaseIndexDataAction
{
    /**
     * @param  LengthAwarePaginator<int, Purchase>  $purchases
     * @return LengthAwarePaginator<int, Purchase>
     */
    public function handle(LengthAwarePaginator $purchases, ?string $sortBy = null, ?string $sortDir = null): LengthAwarePaginator
    {
        // Calculate profit for each purchase
        /** @var ConcretePaginator<int, Purchase> $purchases */
        /** @var \Illuminate\Support\Collection<int, Purchase> $collection */
        $collection = $purchases->getCollection();
        $collection->transform(function (Purchase $purchase): Purchase {
            // Load saleItems relationship
            $purchase->load(['saleItems', 'expenses']);

            // Ensure accessor attributes are appended
            $purchase->append(['profit', 'total_revenue']);

            return $purchase;
        });

        // Sort by profit if needed (after calculation)
        if ($sortBy === 'profit' && in_array($sortDir, ['asc', 'desc'], true)) {
            /** @var \Illuminate\Support\Collection<int, Purchase> $sorted */
            $sorted = $collection->sortBy(fn (Purchase $purchase): float => (float) ($purchase->profit ?? 0), SORT_REGULAR, $sortDir === 'desc');
            $purchases->setCollection($sorted->values());
        }

        return $purchases;
    }
}
