<?php

declare(strict_types=1);

namespace App\Actions;

use App\Mail\PurchaseReceipt;
use App\Models\Purchase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

final readonly class SendPurchaseReceiptEmail
{
    public function handle(Purchase $purchase): bool
    {
        $purchase->load('supplier');

        // Check if supplier exists and has an email. The supplier relationship is already loaded.
        // @phpstan-ignore-next-line booleanNot.alwaysFalse
        if (! $purchase->supplier || ! $purchase->supplier->email) {
            Log::warning("Cannot send purchase receipt email: Purchase {$purchase->id} has no supplier or supplier has no email.");

            return false;
        }

        Mail::to($purchase->supplier->email)->send(new PurchaseReceipt($purchase));

        return true;
    }
}
