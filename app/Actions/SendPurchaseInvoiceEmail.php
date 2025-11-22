<?php

declare(strict_types=1);

namespace App\Actions;

use App\Mail\PurchaseInvoice;
use App\Models\Purchase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

final readonly class SendPurchaseInvoiceEmail
{
    public function handle(Purchase $purchase): void
    {
        $purchase->load('supplier');

        if (! $purchase->supplier || ! $purchase->supplier->email) {
            Log::warning("Cannot send purchase invoice email: Purchase {$purchase->id} has no supplier or supplier has no email.");
            return;
        }

        Mail::to($purchase->supplier->email)->send(new PurchaseInvoice($purchase));
    }
}

