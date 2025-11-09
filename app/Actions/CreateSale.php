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

    public function handle(array $attributes): Sale
    {
        $quantityKg = (float) $attributes['quantity_kg'];
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
