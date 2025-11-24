<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;
use Illuminate\Support\Facades\DB;

final readonly class CreateSale
{
    public function __construct(
        private CreateReceiptAction $createReceipt,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes): Sale
    {
        return DB::transaction(function () use ($attributes): Sale {
            $saleData = collect($attributes)->except(['items'])->toArray();
            /** @var array<string, mixed> $saleData */
            $itemsData = is_array($attributes['items'] ?? null) ? $attributes['items'] : [];

            /** @var list<array{purchase_id:int|numeric-string, quantity_kg:int|float|string, price_per_kg:int|float|string, total_price?:int|float|string}> $itemsData */

            // Calculate subtotal from items
            $subtotal = array_reduce(
                $itemsData,
                fn (float $carry, array $item): float => $carry + (float) $item['quantity_kg'] * (float) $item['price_per_kg'],
                0.0,
            );

            $deliveryFee = isset($saleData['delivery_fee']) && is_numeric($saleData['delivery_fee'])
                ? (float) $saleData['delivery_fee']
                : 0.0;

            $saleData['delivery_fee'] = $deliveryFee;
            $saleData['subtotal'] = $subtotal;
            $saleData['total_amount'] = $subtotal + $deliveryFee;

            /** @var Sale $sale */
            $sale = Sale::query()->create($saleData);

            foreach ($itemsData as $item) {
                $sale->items()->create([
                    'purchase_id' => (int) $item['purchase_id'],
                    'quantity_kg' => (float) $item['quantity_kg'],
                    'price_per_kg' => (float) $item['price_per_kg'],
                    'total_price' => (float) $item['quantity_kg'] * (float) $item['price_per_kg'],
                ]);
            }

            // Auto-create receipt for the sale
            $this->createReceipt->handle($sale);

            return $sale;
        });
    }
}
