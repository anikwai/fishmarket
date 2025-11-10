<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Receipt;
use Illuminate\Support\Facades\DB;

final readonly class VoidReceiptAction
{
    public function handle(Receipt $receipt, string $reason): Receipt
    {
        return DB::transaction(function () use ($receipt, $reason): Receipt {
            if ($receipt->isVoid()) {
                return $receipt;
            }

            $receipt->update([
                'status' => 'void',
                'voided_at' => now(),
                'void_reason' => $reason,
            ]);

            /** @var Receipt */
            $freshReceipt = $receipt->fresh();

            return $freshReceipt;
        });
    }
}
