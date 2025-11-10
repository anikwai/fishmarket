<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Customer;
use App\Models\Sale;

final readonly class GenerateCustomerReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?string $customerId = null): array
    {
        if (! $customerId) {
            return [
                'customers' => Customer::query()
                    ->withCount('sales')
                    ->withSum('sales', 'total_amount')
                    ->orderBy('name')
                    ->get()
                    ->map(fn (Customer $customer): array => [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'phone' => $customer->phone,
                        'type' => $customer->type,
                        'total_sales' => (int) ($customer->sales_count ?? 0),
                        'total_revenue' => (isset($customer->sales_sum_total_amount) && is_numeric($customer->sales_sum_total_amount)) ? (float) $customer->sales_sum_total_amount : 0.0,
                    ]),
            ];
        }

        $customer = Customer::query()
            /** @phpstan-ignore-next-line */
            ->with(['sales' => function (\Illuminate\Database\Eloquent\Relations\HasMany $q): void {
                $q->latest('sale_date')->limit(20);
            }])
            ->findOrFail($customerId);

        $outstandingCredits = $customer->sales()
            ->where('is_credit', true)
            ->with(['payments'])
            ->get()
            ->filter(fn (Sale $sale): bool => $sale->outstanding_balance > 0);

        return [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'type' => $customer->type,
                'address' => $customer->address,
            ],
            'summary' => [
                'total_sales' => $customer->sales()->count(),
                'total_revenue' => (float) $customer->sales()->sum('total_amount'),
                'outstanding_credits' => (float) $outstandingCredits->sum(fn (Sale $sale): float => (float) $sale->outstanding_balance),
                'credit_count' => $outstandingCredits->count(),
            ],
            'recent_sales' => $customer->sales->map(fn (Sale $sale): array => [
                'id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'amount' => (float) $sale->total_amount,
                'quantity' => (float) $sale->quantity_kg,
                'is_credit' => $sale->is_credit,
                'outstanding' => $sale->is_credit ? (float) $sale->outstanding_balance : 0.0,
            ]),
            'outstanding_credits' => $outstandingCredits->map(fn (Sale $sale): array => [
                'sale_id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'total' => (float) $sale->total_amount,
                'paid' => (float) $sale->payments->sum('amount'), // @phpstan-ignore cast.double
                'outstanding' => (float) $sale->outstanding_balance,
            ]),
        ];
    }
}
