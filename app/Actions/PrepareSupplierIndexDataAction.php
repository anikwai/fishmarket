<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as ConcretePaginator;

final readonly class PrepareSupplierIndexDataAction
{
    /**
     * @param  LengthAwarePaginator<int, Supplier>  $suppliers
     * @return LengthAwarePaginator<int, Supplier>
     */
    public function handle(LengthAwarePaginator $suppliers, ?string $sortBy = null, ?string $sortDir = null): LengthAwarePaginator
    {
        // Calculate remaining stock for each supplier
        /** @var ConcretePaginator<int, Supplier> $suppliers */
        /** @var \Illuminate\Support\Collection<int, Supplier> $collection */
        $collection = $suppliers->getCollection();
        $collection->transform(fn (Supplier $supplier): Supplier => $supplier);

        // Sort by remaining_stock if needed (after calculation)
        if ($sortBy === 'remaining_stock' && in_array($sortDir, ['asc', 'desc'], true)) {
            /** @var \Illuminate\Support\Collection<int, Supplier> $sorted */
            $sorted = $collection->sortBy(fn (Supplier $supplier): float => (float) ($supplier->remaining_stock ?? 0), SORT_REGULAR, $sortDir === 'desc');
            $suppliers->setCollection($sorted->values());
        }

        return $suppliers;
    }
}
