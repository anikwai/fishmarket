<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;
use App\Support\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class CreateSale
{
    public function __construct(
        private AllocatePurchasesToSale $allocatePurchases,
        private CreateReceiptAction $createReceipt,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes): Sale
    {
        $quantityKg = (isset($attributes['quantity_kg']) && is_numeric($attributes['quantity_kg'])) ? (float) $attributes['quantity_kg'] : 0.0;
        $currentStock = Stock::current();

        if ($quantityKg > $currentStock) {
            throw ValidationException::withMessages([
                'quantity_kg' => ['Insufficient stock. Available: '.number_format($currentStock, 2).' kg'],
            ]);
        }

        return DB::transaction(function () use ($attributes, $quantityKg): Sale {
            $sale = Sale::query()->create($attributes);
            $this->allocatePurchases->handle($sale, $quantityKg);

            // Auto-create receipt for the sale
            $this->createReceipt->handle($sale);

            return $sale;
        });
    }
}
