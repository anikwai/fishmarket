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
        $purchases->getCollection()->transform(function (Purchase $purchase) {
            // Load sales relationship with pivot data
            $purchase->load(['sales' => function ($query) {
                $query->withPivot('quantity_kg');
            }, 'expenses']);

            // Access the accessors to calculate values
            $purchase->profit = $purchase->profit;
            $purchase->total_revenue = $purchase->total_revenue;
            $purchase->remaining_quantity = $purchase->remaining_quantity;
            $purchase->total_expenses = $purchase->total_expenses;

            return $purchase;
        });

        // Sort by profit if needed (after calculation)
        if ($sortBy === 'profit' && in_array($sortDir, ['asc', 'desc'])) {
            $purchases->getCollection()->sortBy(function (Purchase $purchase) {
                return (float) ($purchase->profit ?? 0);
            }, SORT_REGULAR, $sortDir === 'desc');
        }

        return $purchases;
    }
}
