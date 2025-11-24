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

        // Create Purchases (spread over last 60 days) and track remaining stock per purchase
        $purchaseStock = [];
        foreach ($suppliers as $supplier) {
            $count = fake()->numberBetween(3, 6);
            for ($i = 0; $i < $count; $i++) {
                $date = Date::now()->subDays(fake()->numberBetween(1, 60));
                $purchase = Purchase::factory()->create([
                    'supplier_id' => $supplier->id,
                    'purchase_date' => $date,
                    'quantity_kg' => fake()->randomFloat(2, 50, 200),
                    'price_per_kg' => fake()->randomFloat(2, 20, 40),
                ]);

                $purchaseStock[$purchase->id] = [
                    'purchase' => $purchase,
                    'remaining' => (float) $purchase->quantity_kg,
                ];

                // Add expenses linked to purchase (Shipping/Ice)
                if (fake()->boolean()) {
                    Expense::factory()->create([
                        'purchase_id' => $purchase->id,
                        'expense_date' => $date,
                        'type' => fake()->randomElement(['shipping', 'ice']),
                        'amount' => fake()->randomFloat(2, 50, 300),
                    ]);
                }
            }
        }

        // Create General Expenses (not linked to purchase)
        Expense::factory()->count(10)->create([
            'purchase_id' => null,
            'expense_date' => Date::now()->subDays(fake()->numberBetween(1, 30)),
            'type' => 'other',
            'amount' => fake()->randomFloat(2, 20, 100),
        ]);

        // Create Sales with sale items tied to existing purchases
        foreach ($customers as $customer) {
            $count = fake()->numberBetween(3, 8);

            for ($i = 0; $i < $count; $i++) {
                // Skip if no stock remains
                $availablePurchases = array_filter(
                    $purchaseStock,
                    fn (array $entry): bool => $entry['remaining'] > 1
                );

                if (count($availablePurchases) === 0) {
                    break;
                }

                $date = Date::now()->subDays(fake()->numberBetween(1, 30));
                $items = [];
                $itemsToUse = fake()->numberBetween(1, min(3, count($availablePurchases)));
                $selectedPurchaseIds = collect(array_keys($availablePurchases))
                    ->shuffle()
                    ->take($itemsToUse)
                    ->all();

                foreach ($selectedPurchaseIds as $purchaseId) {
                    $entry = &$purchaseStock[$purchaseId];

                    $maxQty = max(0.5, min(20.0, $entry['remaining']));
                    $quantity = fake()->randomFloat(2, 0.5, $maxQty);
                    $price = (float) $entry['purchase']->price_per_kg + fake()->randomFloat(2, 2, 15);
                    $items[] = [
                        'purchase_id' => $purchaseId,
                        'quantity_kg' => $quantity,
                        'price_per_kg' => $price,
                        'total_price' => $quantity * $price,
                    ];

                    $entry['remaining'] -= $quantity;
                    unset($entry);
                }

                if ($items === []) {
                    continue;
                }

                /** @var list<array{purchase_id:int, quantity_kg:float, price_per_kg:float, total_price:float}> $items */
                $subtotal = array_reduce(
                    $items,
                    fn (float $carry, array $item): float => $carry + $item['total_price'],
                    0.0,
                );
                $deliveryFee = fake()->boolean() ? fake()->randomFloat(2, 10, 50) : 0.0;
                $totalAmount = $subtotal + $deliveryFee;
                $isCredit = fake()->boolean();

                $sale = Sale::query()->create([
                    'customer_id' => $customer->id,
                    'sale_date' => $date,
                    'subtotal' => $subtotal,
                    'delivery_fee' => $deliveryFee,
                    'total_amount' => $totalAmount,
                    'is_credit' => $isCredit,
                    'is_delivery' => $deliveryFee > 0,
                    'notes' => fake()->optional()->sentence(),
                ]);

                $sale->items()->createMany($items);

                // Payments: 70% fully paid, 20% partial, 10% unpaid (only for credit sales)
                $paymentType = fake()->numberBetween(1, 10);
                if (! $isCredit || $paymentType <= 7) {
                    Payment::factory()->create([
                        'sale_id' => $sale->id,
                        'payment_date' => $date->copy()->addDays(fake()->numberBetween(0, 5)),
                        'amount' => $totalAmount,
                    ]);
                } elseif ($paymentType <= 9) {
                    Payment::factory()->create([
                        'sale_id' => $sale->id,
                        'payment_date' => $date->copy()->addDays(fake()->numberBetween(0, 5)),
                        'amount' => $totalAmount * (fake()->numberBetween(20, 80) / 100),
                    ]);
                }
            }
        }
    }
}
