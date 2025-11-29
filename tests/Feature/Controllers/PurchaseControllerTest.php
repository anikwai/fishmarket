<?php

declare(strict_types=1);

use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    $this->user = User::factory()->create();
    Permission::create(['name' => 'view purchases']);
    Permission::create(['name' => 'create purchases']);
    $this->user->givePermissionTo(['view purchases', 'create purchases']);
});

test('can view purchases index', function (): void {
    Purchase::factory()->count(3)->create();

    actingAs($this->user)
        ->get(route('purchases.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Purchases/Index')
            ->has('purchases.data', 3)
        );
});

test('stores supplier invoice and receipt metadata and files', function (): void {
    Storage::fake('public');

    $supplier = Supplier::factory()->create(['email' => 'supplier@example.com']);

    $invoiceFile = UploadedFile::fake()->create('invoice.pdf', 10, 'application/pdf');
    $receiptFile = UploadedFile::fake()->image('receipt.jpg', 100, 100);

    actingAs($this->user)
        ->post(route('purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => now()->toDateString(),
            'quantity_kg' => 10,
            'price_per_kg' => 5,
            'description' => 'Test fish',
            'notes' => 'Test notes',
            'supplier_invoice_number' => 'INV-42',
            'supplier_invoice_date' => now()->toDateString(),
            'supplier_invoice_amount' => 50,
            'supplier_invoice_file' => $invoiceFile,
            'supplier_receipt_number' => 'RCT-42',
            'supplier_receipt_date' => now()->toDateString(),
            'supplier_receipt_amount' => 50,
            'supplier_receipt_file' => $receiptFile,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $purchase = Purchase::query()->latest()->first();

    expect($purchase)->not->toBeNull();
    expect($purchase?->supplier_invoice_number)->toBe('INV-42');
    expect($purchase?->supplier_receipt_number)->toBe('RCT-42');

    Storage::disk('public')->assertExists($purchase->supplier_invoice_path);
    Storage::disk('public')->assertExists($purchase->supplier_receipt_path);
});
