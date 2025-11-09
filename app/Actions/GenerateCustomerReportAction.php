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
                    ->map(fn ($customer) => [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'phone' => $customer->phone,
                        'type' => $customer->type,
                        'total_sales' => (int) $customer->sales_count,
                        'total_revenue' => (float) $customer->sales_sum_total_amount,
                    ]),
            ];
        }

        $customer = Customer::query()
            ->with(['sales' => fn ($q) => $q->orderByDesc('sale_date')->limit(20)])
            ->findOrFail($customerId);

        $outstandingCredits = $customer->sales()
            ->where('is_credit', true)
            ->with('payments')
            ->get()
            ->filter(fn (Sale $sale) => $sale->outstanding_balance > 0);

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
                'total_revenue' => $customer->sales()->sum('total_amount'),
                'outstanding_credits' => $outstandingCredits->sum('outstanding_balance'),
                'credit_count' => $outstandingCredits->count(),
            ],
            'recent_sales' => $customer->sales->map(fn ($sale) => [
                'id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'amount' => $sale->total_amount,
                'quantity' => $sale->quantity_kg,
                'is_credit' => $sale->is_credit,
                'outstanding' => $sale->is_credit ? $sale->outstanding_balance : 0,
            ]),
            'outstanding_credits' => $outstandingCredits->map(fn ($sale) => [
                'sale_id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'total' => $sale->total_amount,
                'paid' => $sale->payments->sum('amount'),
                'outstanding' => $sale->outstanding_balance,
            ]),
        ];
    }
}
