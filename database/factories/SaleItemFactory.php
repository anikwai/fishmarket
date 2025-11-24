<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\SaleItem>
 */
final class SaleItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $purchase = Purchase::factory()->create();
        $quantity = fake()->randomFloat(2, 0.5, 10);
        $price = fake()->randomFloat(2, (float) $purchase->price_per_kg, (float) $purchase->price_per_kg + 20);

        return [
            'sale_id' => Sale::factory(),
            'purchase_id' => $purchase->id,
            'quantity_kg' => $quantity,
            'price_per_kg' => $price,
            'total_price' => $quantity * $price,
        ];
    }
}
