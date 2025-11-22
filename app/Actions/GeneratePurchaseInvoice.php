<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;
use Barryvdh\DomPDF\Facade\Pdf;

final readonly class GeneratePurchaseInvoice
{
    public function handle(Purchase $purchase): \Barryvdh\DomPDF\PDF
    {
        $purchase->load(['supplier']);

        return Pdf::loadView('invoices.purchase', [
            'purchase' => $purchase,
        ]);
    }
}

