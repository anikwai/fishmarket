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
        $sale->load('customer');

        $recipient = $sale->customer->email ?? null;

        // Ensure we have a customer with a valid email before attempting to send.
        if (! $recipient) {
            Log::warning("Cannot send sale invoice email: Sale {$sale->id} has no customer email.");

            return false;
        }

        Mail::to($recipient)->queue(new SaleInvoice($sale));

        return true;
    }
}
