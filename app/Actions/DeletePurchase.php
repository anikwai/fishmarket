<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;
use Illuminate\Support\Facades\Storage;

final readonly class DeletePurchase
{
    public function handle(Purchase $purchase): void
    {
        if ($purchase->supplier_invoice_path) {
            Storage::disk('public')->delete($purchase->supplier_invoice_path);
        }

        if ($purchase->supplier_receipt_path) {
            Storage::disk('public')->delete($purchase->supplier_receipt_path);
        }

        $purchase->delete();
    }
}
