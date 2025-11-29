<?php

declare(strict_types=1);

use App\Mail\SaleInvoice;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    $this->user = User::factory()->create();
    Permission::create(['name' => 'view sales']);
    $this->user->givePermissionTo('view sales');
});

test('sends invoice email when customer has email', function (): void {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'customer@example.com']);
    $sale = Sale::factory()->create(['customer_id' => $customer->id]);

    actingAs($this->user)
        ->post(route('sales.invoice.email', $sale))
        ->assertRedirect()
        ->assertSessionHas('success', 'Invoice emailed to customer successfully.');

    Mail::assertSent(
        SaleInvoice::class,
        fn (SaleInvoice $mail): bool => $mail->hasTo($customer->email),
    );
});

test('does not send invoice email when customer has no email', function (): void {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => null]);
    $sale = Sale::factory()->create(['customer_id' => $customer->id]);

    actingAs($this->user)
        ->post(route('sales.invoice.email', $sale))
        ->assertRedirect()
        ->assertSessionHas('error', 'Customer has no email; invoice not sent.');

    Mail::assertNothingSent();
});
