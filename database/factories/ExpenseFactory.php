<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Expense>
 */
final class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purchase_id' => null,
            'expense_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'type' => fake()->randomElement(['shipping', 'ice', 'other']),
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 10, 500),
        ];
    }
}
