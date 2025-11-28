<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;

final readonly class GenerateSaleInvoice
{
    public function handle(Sale $sale): \Barryvdh\DomPDF\PDF
    {
        $sale->load(['customer', 'items.purchase.supplier', 'payments']);

        return Pdf::loadView('invoices.sale', [
            'sale' => $sale,
        ]);
    }
}
