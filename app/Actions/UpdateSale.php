<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;
use Illuminate\Support\Facades\DB;

final readonly class UpdateSale
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Sale $sale, array $attributes): void
    {
        DB::transaction(function () use ($sale, $attributes): void {
            /** @var array<string, mixed> $saleData */
            $saleData = collect($attributes)->except(['items'])->toArray();
            /** @var list<array<string, mixed>> $itemsData */
            $itemsData = is_array($attributes['items'] ?? null) ? $attributes['items'] : [];

            $sale->update($saleData);

            $existingItems = $sale->items()->get()->keyBy('id');
            $keptItemIds = [];
            $subtotal = 0.0;

            foreach ($itemsData as $item) {
                $quantity = isset($item['quantity_kg']) && is_numeric($item['quantity_kg']) ? (float) $item['quantity_kg'] : 0.0;
                $pricePerKg = isset($item['price_per_kg']) && is_numeric($item['price_per_kg']) ? (float) $item['price_per_kg'] : 0.0;
                $totalPrice = $quantity * $pricePerKg;

                $purchaseId = isset($item['purchase_id']) && is_numeric($item['purchase_id'])
                    ? (int) $item['purchase_id']
                    : null;

                $payload = [
                    'purchase_id' => $purchaseId,
                    'quantity_kg' => $quantity,
                    'price_per_kg' => $pricePerKg,
                    'total_price' => $totalPrice,
                ];

                $itemId = isset($item['id']) && is_numeric($item['id']) ? (int) $item['id'] : null;

                if ($itemId !== null && $existingItems->has($itemId)) {
                    $existingItems->get($itemId)?->update($payload);
                    $keptItemIds[] = $itemId;
                } else {
                    $newItem = $sale->items()->create($payload);
                    $keptItemIds[] = $newItem->id;
                }

                $subtotal += $totalPrice;
            }

            $itemsToDelete = $existingItems->keys()->reject(fn (int $id): bool => in_array($id, $keptItemIds, true));

            if ($itemsToDelete->isNotEmpty()) {
                $sale->items()->whereIn('id', $itemsToDelete)->delete();
            }

            $deliveryFee = isset($saleData['delivery_fee']) && is_numeric($saleData['delivery_fee'])
                ? (float) $saleData['delivery_fee']
                : (float) $sale->delivery_fee;

            $sale->forceFill([
                'subtotal' => $subtotal,
                'total_amount' => $subtotal + $deliveryFee,
            ])->save();
        });
    }
}
