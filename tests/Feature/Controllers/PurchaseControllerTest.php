<?php

declare(strict_types=1);

use App\Mail\PurchaseInvoice;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    $this->user = User::factory()->create();
    Permission::create(['name' => 'view purchases']);
    $this->user->givePermissionTo('view purchases');
});

test('sends invoice email when supplier has email', function (): void {
    Mail::fake();

    $supplier = Supplier::factory()->create(['email' => 'supplier@example.com']);
    $purchase = Purchase::factory()->create(['supplier_id' => $supplier->id]);

    actingAs($this->user)
        ->post(route('purchases.invoice.email', $purchase))
        ->assertRedirect()
        ->assertSessionHas('success', 'Invoice emailed to supplier successfully.');

    Mail::assertSent(PurchaseInvoice::class, fn ($mail) => $mail->hasTo($supplier->email));
});

test('does not send invoice email when supplier has no email', function (): void {
    Mail::fake();

    $supplier = Supplier::factory()->create(['email' => null]);
    $purchase = Purchase::factory()->create(['supplier_id' => $supplier->id]);

    actingAs($this->user)
        ->post(route('purchases.invoice.email', $purchase))
        ->assertRedirect()
        ->assertSessionHas('error', 'Supplier has no email; invoice not sent.');

    Mail::assertNothingSent();
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
