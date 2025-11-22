<?php

declare(strict_types=1);

namespace Database\Factories;

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
        return [
            'supplier_id' => \App\Models\Supplier::factory(),
            'purchase_date' => $this->faker->date(),
            'quantity_kg' => $this->faker->randomFloat(2, 10, 100),
            'price_per_kg' => $this->faker->randomFloat(2, 5, 50),
            // @phpstan-ignore-next-line
            'total_cost' => fn (array $attributes): float => (float) $attributes['quantity_kg'] * (float) $attributes['price_per_kg'],
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
