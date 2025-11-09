<?php

declare(strict_types=1);

namespace App\Actions;

use App\Mail\SaleReceipt;
use App\Models\Receipt;
use Illuminate\Support\Facades\Mail;

final readonly class SendReceiptEmail
{
    public function handle(Receipt $receipt): void
    {
        $receipt->load('sale.customer');

        if (! $receipt->sale->customer->email) {
            return;
        }

        Mail::to($receipt->sale->customer->email)->send(new SaleReceipt($receipt->sale, $receipt));
    }
}
