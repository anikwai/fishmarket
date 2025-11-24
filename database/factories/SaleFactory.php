<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Sale>
 */
final class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 100, 600);
        $delivery = fake()->boolean() ? fake()->randomFloat(2, 10, 60) : 0.0;

        return [
            'customer_id' => Customer::factory(),
            'sale_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'subtotal' => $subtotal,
            'delivery_fee' => $delivery,
            'total_amount' => $subtotal + $delivery,
            'is_credit' => fake()->boolean(),
            'is_delivery' => $delivery > 0,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Create associated sale items after the sale is created to keep totals consistent.
     */
    public function configure(): static
    {
        return $this->afterCreating(function ($sale): void {
            $itemsCount = fake()->numberBetween(1, 3);
            /** @var \Illuminate\Support\Collection<int, array{purchase_id:int, quantity_kg:float, price_per_kg:float, total_price:float}> $items */
            $items = collect();

            for ($i = 0; $i < $itemsCount; $i++) {
                $purchase = Purchase::factory()->create();
                $quantity = fake()->randomFloat(2, 0.5, 20);
                $price = fake()->randomFloat(2, (float) $purchase->price_per_kg, (float) $purchase->price_per_kg + 30);
                $items->push([
                    'purchase_id' => $purchase->id,
                    'quantity_kg' => $quantity,
                    'price_per_kg' => $price,
                    'total_price' => $quantity * $price,
                ]);
            }

            if ($items->isNotEmpty()) {
                $subtotal = (float) $items->sum(fn (array $item): float => $item['total_price']);
                $sale->update([
                    'subtotal' => $subtotal,
                    'total_amount' => $subtotal + (float) $sale->delivery_fee,
                ]);

                $sale->items()->createMany($items->all());
            }
        });
    }
}
