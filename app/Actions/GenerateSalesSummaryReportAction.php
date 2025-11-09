<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;

final readonly class GenerateSalesSummaryReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(string $startDate, string $endDate, ?string $customerId = null): array
    {
        $query = Sale::query()
            ->whereBetween('sale_date', [$startDate, $endDate]);

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        $sales = $query->with('customer')->get();

        $dailyData = Sale::query()
            ->selectRaw('sale_date::date as date')
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('SUM(quantity_kg) as quantity')
            ->selectRaw('COUNT(*) as count')
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->when($customerId, fn ($q) => $q->where('customer_id', $customerId))
            ->groupByRaw('sale_date::date')
            ->orderBy('date')
            ->get();

        return [
            'summary' => [
                'total_revenue' => $sales->sum('total_amount'),
                'total_quantity' => $sales->sum('quantity_kg'),
                'total_sales' => $sales->count(),
                'average_sale' => $sales->count() > 0 ? $sales->sum('total_amount') / $sales->count() : 0,
                'credit_sales' => $sales->where('is_credit', true)->sum('total_amount'),
                'cash_sales' => $sales->where('is_credit', false)->sum('total_amount'),
            ],
            'daily_data' => $dailyData->map(fn ($item) => [
                'date' => $item->date,
                'revenue' => (float) $item->revenue,
                'quantity' => (float) $item->quantity,
                'count' => (int) $item->count,
            ]),
            'recent_sales' => $sales->take(10)->map(fn ($sale) => [
                'id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'customer' => $sale->customer->name,
                'amount' => $sale->total_amount,
                'quantity' => $sale->quantity_kg,
                'is_credit' => $sale->is_credit,
            ]),
        ];
    }
}
