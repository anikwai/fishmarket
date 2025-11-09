<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;

final readonly class GetCreditSalesForPaymentAction
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function handle(): array
    {
        return Sale::query()
            ->where('is_credit', true)
            ->with('customer', 'payments')
            ->get()
            ->filter(fn (Sale $sale) => $sale->outstanding_balance > 0)
            ->map(fn (Sale $sale) => [
                'id' => $sale->id,
                'customer_name' => $sale->customer->name,
                'total_amount' => $sale->total_amount,
                'outstanding_balance' => $sale->outstanding_balance,
            ])
            ->values()
            ->toArray();
    }
}
