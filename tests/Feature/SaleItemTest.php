<?php

declare(strict_types=1);

use App\Models\Customer;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

beforeEach(function (): void {
    $this->user = User::factory()->create();
    Permission::create(['name' => 'create sales']);
    $this->user->givePermissionTo('create sales');
});

test('can create a sale with multiple items', function (): void {
    $customer = Customer::factory()->create();
    $supplier1 = Supplier::factory()->create();
    $supplier2 = Supplier::factory()->create();

    $purchase1 = Purchase::factory()->create([
        'supplier_id' => $supplier1->id,
        'quantity_kg' => 100,
        'price_per_kg' => 10,
    ]);

    $purchase2 = Purchase::factory()->create([
        'supplier_id' => $supplier2->id,
        'quantity_kg' => 50,
        'price_per_kg' => 15,
    ]);

    $saleData = [
        'customer_id' => $customer->id,
        'sale_date' => now()->toDateString(),
        'delivery_fee' => 10,
        'is_credit' => false,
        'is_delivery' => true,
        'notes' => 'Test sale',
        'items' => [
            [
                'purchase_id' => $purchase1->id,
                'quantity_kg' => 20,
                'price_per_kg' => 12,
            ],
            [
                'purchase_id' => $purchase2->id,
                'quantity_kg' => 10,
                'price_per_kg' => 18,
            ],
        ],
    ];

    actingAs($this->user)
        ->from(route('sales.index'))
        ->post(route('sales.store'), $saleData)
        ->assertRedirect(route('sales.index'))
        ->assertSessionHas('success', 'Sale created successfully.');

    $sale = Sale::query()->latest()->first();

    expect($sale->items)->toHaveCount(2);
    expect($sale->subtotal)->toEqual(20 * 12 + 10 * 18); // 240 + 180 = 420
    expect($sale->total_amount)->toEqual(420 + 10); // 430

    assertDatabaseHas('sale_items', [
        'sale_id' => $sale->id,
        'purchase_id' => $purchase1->id,
        'quantity_kg' => 20,
        'price_per_kg' => 12,
        'total_price' => 240,
    ]);

    assertDatabaseHas('sale_items', [
        'sale_id' => $sale->id,
        'purchase_id' => $purchase2->id,
        'quantity_kg' => 10,
        'price_per_kg' => 18,
        'total_price' => 180,
    ]);

    // Verify stock deduction
    expect($purchase1->fresh()->remaining_quantity)->toEqual(80);
    expect($purchase2->fresh()->remaining_quantity)->toEqual(40);
});

test('cannot create sale with insufficient stock', function (): void {
    $customer = Customer::factory()->create();
    $purchase = Purchase::factory()->create([
        'quantity_kg' => 10,
    ]);

    $saleData = [
        'customer_id' => $customer->id,
        'sale_date' => now()->toDateString(),
        'items' => [
            [
                'purchase_id' => $purchase->id,
                'quantity_kg' => 15, // Exceeds stock
                'price_per_kg' => 12,
            ],
        ],
    ];

    actingAs($this->user)
        ->post(route('sales.store'), $saleData)
        ->assertSessionHasErrors(['items.0.quantity_kg']);
});
