<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final readonly class PrepareSupplierIndexDataAction
{
    public function handle(LengthAwarePaginator $suppliers, ?string $sortBy = null, ?string $sortDir = null): LengthAwarePaginator
    {
        // Calculate remaining stock for each supplier
        $suppliers->getCollection()->transform(function (Supplier $supplier) {
            $supplier->remaining_stock = $supplier->remaining_stock;

            return $supplier;
        });

        // Sort by remaining_stock if needed (after calculation)
        if ($sortBy === 'remaining_stock' && in_array($sortDir, ['asc', 'desc'])) {
            $suppliers->getCollection()->sortBy(function (Supplier $supplier) {
                return (float) ($supplier->remaining_stock ?? 0);
            }, SORT_REGULAR, $sortDir === 'desc');
        }

        return $suppliers;
    }
}
