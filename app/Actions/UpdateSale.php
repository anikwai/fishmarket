<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;
use App\Support\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class UpdateSale
{
    public function __construct(
        private AllocatePurchasesToSale $allocatePurchases,
    ) {}

    public function handle(Sale $sale, array $attributes): void
    {
        $newQuantityKg = isset($attributes['quantity_kg']) ? (float) $attributes['quantity_kg'] : $sale->quantity_kg;
        $quantityDifference = $newQuantityKg - $sale->quantity_kg;

        if ($quantityDifference > 0) {
            $currentStock = Stock::current();
            if ($quantityDifference > $currentStock) {
                throw ValidationException::withMessages([
                    'quantity_kg' => ['Insufficient stock. Available: '.number_format($currentStock, 2).' kg'],
                ]);
            }
        }

        DB::transaction(function () use ($sale, $attributes, $newQuantityKg): void {
            $sale->update($attributes);

            // Reallocate purchases if quantity changed
            if (isset($attributes['quantity_kg'])) {
                $this->allocatePurchases->reallocate($sale, $newQuantityKg);
            }
        });
    }
}
