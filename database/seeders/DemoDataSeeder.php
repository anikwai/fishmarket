<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Date;

final class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create Suppliers
        $suppliers = Supplier::factory()->count(5)->create();

        // Create Customers
        $customers = Customer::factory()->count(10)->create();

        // Create Purchases (spread over last 60 days)
        foreach ($suppliers as $supplier) {
            // Each supplier has 3-6 purchases
            $count = fake()->numberBetween(3, 6);
            for ($i = 0; $i < $count; $i++) {
                $date = Date::now()->subDays(fake()->numberBetween(1, 60));
                $purchase = Purchase::factory()->create([
                    'supplier_id' => $supplier->id,
                    'purchase_date' => $date,
                    'quantity_kg' => fake()->numberBetween(50, 200),
                    'price_per_kg' => fake()->numberBetween(20, 40),
                ]);

                // Add expenses linked to purchase (Shipping/Ice)
                if (fake()->boolean()) {
                    Expense::factory()->create([
                        'purchase_id' => $purchase->id,
                        'expense_date' => $date,
                        'type' => fake()->randomElement(['shipping', 'ice']),
                        'amount' => fake()->numberBetween(50, 300),
                    ]);
                }
            }
        }

        // Create General Expenses (not linked to purchase)
        Expense::factory()->count(10)->create([
            'purchase_id' => null,
            'expense_date' => Date::now()->subDays(fake()->numberBetween(1, 30)),
            'type' => 'other',
            'amount' => fake()->numberBetween(20, 100),
        ]);

        // Create Sales (spread over last 30 days)
        foreach ($customers as $customer) {
            // Each customer has 3-8 sales
            $count = fake()->numberBetween(3, 8);
            for ($i = 0; $i < $count; $i++) {
                $date = Date::now()->subDays(fake()->numberBetween(1, 30));
                $quantity = fake()->numberBetween(5, 50);
                $price = fake()->numberBetween(45, 60); // Higher than purchase price
                $delivery = fake()->boolean() ? fake()->numberBetween(10, 50) : 0;

                $sale = Sale::factory()->create([
                    'customer_id' => $customer->id,
                    'sale_date' => $date,
                    'quantity_kg' => $quantity,
                    'price_per_kg' => $price,
                    'delivery_fee' => $delivery,
                    'is_delivery' => (bool) $delivery,
                    'is_credit' => fake()->boolean(), // Randomize credit/cash sales
                ]);

                // Create Payment
                // 70% Fully paid, 20% Partially paid, 10% Unpaid
                $paymentType = fake()->numberBetween(1, 10);
                if ($paymentType <= 7) {
                    // Full payment
                    Payment::factory()->create([
                        'sale_id' => $sale->id,
                        'payment_date' => $date->copy()->addDays(fake()->numberBetween(0, 5)),
                        'amount' => $sale->total_amount,
                    ]);
                } elseif ($paymentType <= 9) {
                    // Partial payment
                    Payment::factory()->create([
                        'sale_id' => $sale->id,
                        'payment_date' => $date->copy()->addDays(fake()->numberBetween(0, 5)),
                        'amount' => $sale->total_amount * (fake()->numberBetween(20, 80) / 100),
                    ]);
                }
                // else unpaid
            }
        }
    }
}
