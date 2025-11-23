<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Purchase>
 */
final class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->randomFloat(2, 10, 1000);
        $price = fake()->randomFloat(2, 10, 50);

        return [
            'supplier_id' => Supplier::factory(),
            'purchase_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'quantity_kg' => $quantity,
            'price_per_kg' => $price,
            'total_cost' => $quantity * $price,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
