<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Receipt;
use Illuminate\Support\Facades\DB;

final readonly class ReissueReceiptAction
{
    public function __construct(
        private CreateReceiptAction $createReceipt,
    ) {}

    public function handle(Receipt $originalReceipt): Receipt
    {
        return DB::transaction(function () use ($originalReceipt): Receipt {
            // Mark original as reissued
            $originalReceipt->update([
                'status' => 'reissued',
            ]);

            // Create new receipt
            $newReceipt = $this->createReceipt->handle($originalReceipt->sale);
            $newReceipt->update([
                'reissued_from_id' => $originalReceipt->id,
            ]);

            return $newReceipt->fresh();
        });
    }
}
