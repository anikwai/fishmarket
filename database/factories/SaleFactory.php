<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Customer;
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
        $quantity = fake()->randomFloat(2, 1, 100);
        $price = fake()->randomFloat(2, 20, 80);
        $discount = fake()->numberBetween(0, 10);
        $subtotal = $quantity * $price * (1 - $discount / 100);
        /** @var int $deliveryValue */
        $deliveryValue = fake()->randomElement([0, 20, 50]);
        $delivery = (float) $deliveryValue;

        return [
            'customer_id' => Customer::factory(),
            'sale_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'quantity_kg' => $quantity,
            'price_per_kg' => $price,
            'discount_percentage' => $discount,
            'subtotal' => $subtotal,
            'delivery_fee' => $delivery,
            'total_amount' => $subtotal + $delivery,
            'is_credit' => fake()->boolean(),
            'is_delivery' => $delivery > 0,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
