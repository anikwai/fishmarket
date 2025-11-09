<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Receipt;
use Barryvdh\DomPDF\Facade\Pdf;

final readonly class GenerateReceipt
{
    public function handle(Receipt $receipt): \Barryvdh\DomPDF\PDF
    {
        $receipt->load(['sale.customer', 'sale.payments']);

        return Pdf::loadView('receipts.sale', [
            'receipt' => $receipt,
            'sale' => $receipt->sale,
        ]);
    }
}
