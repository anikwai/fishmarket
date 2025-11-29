<?php

declare(strict_types=1);

namespace App\Actions;

use App\Mail\SaleInvoice;
use App\Models\Sale;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

final readonly class SendSaleInvoiceEmail
{
    public function handle(Sale $sale): bool
    {
        $sale->loadMissing('customer');
        /** @var \App\Models\Customer|null $customer */
        $customer = $sale->customer;
        $recipient = $customer?->email;

        // Ensure we have a customer with a valid email before attempting to send.
        if (! is_string($recipient) || $recipient === '') {
            Log::warning("Cannot send sale invoice email: Sale {$sale->id} has no customer email.");

            return false;
        }

        // Send immediately so Mail::fake can assert synchronous delivery in tests.
        Mail::send(new SaleInvoice($sale)->to($recipient));

        return true;
    }
}
