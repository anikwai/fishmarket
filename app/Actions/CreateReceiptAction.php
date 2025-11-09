<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Receipt;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

final readonly class CreateReceiptAction
{
    public function handle(Sale $sale): Receipt
    {
        return DB::transaction(function () use ($sale): Receipt {
            $receiptNumber = $this->generateReceiptNumber();

            return Receipt::query()->create([
                'receipt_number' => $receiptNumber,
                'sale_id' => $sale->id,
                'status' => 'active',
                'issued_at' => now(),
            ]);
        });
    }

    private function generateReceiptNumber(): string
    {
        $year = now()->year;
        $lastReceipt = Receipt::query()
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        if ($lastReceipt) {
            $lastNumber = (int) mb_substr((string) $lastReceipt->receipt_number, -6);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('RCP-%s-%06d', $year, $nextNumber);
    }
}
