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
            ->when($customerId, fn (\Illuminate\Database\Eloquent\Builder $q) => $q->where('customer_id', $customerId))
            ->groupByRaw('sale_date::date')
            ->orderBy('date')
            ->get();

        return [
            'summary' => [
                'total_revenue' => (float) $sales->sum('total_amount'), // @phpstan-ignore cast.double
                'total_quantity' => (float) $sales->sum('quantity_kg'), // @phpstan-ignore cast.double
                'total_sales' => $sales->count(),
                'average_sale' => $sales->count() > 0 ? (float) $sales->sum('total_amount') / $sales->count() : 0.0, // @phpstan-ignore cast.double
                'credit_sales' => (float) $sales->where('is_credit', true)->sum('total_amount'), // @phpstan-ignore cast.double
                'cash_sales' => (float) $sales->where('is_credit', false)->sum('total_amount'), // @phpstan-ignore cast.double
            ],
            'daily_data' => $dailyData->map(fn (object $item): array => [
                'date' => $item->date ?? '',
                'revenue' => (isset($item->revenue) && is_numeric($item->revenue)) ? (float) $item->revenue : 0.0,
                'quantity' => (isset($item->quantity) && is_numeric($item->quantity)) ? (float) $item->quantity : 0.0,
                'count' => (isset($item->count) && is_numeric($item->count)) ? (int) $item->count : 0,
            ]),
            'recent_sales' => $sales->take(10)->map(fn (Sale $sale): array => [
                'id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'customer' => $sale->customer->name,
                'amount' => (float) $sale->total_amount,
                'quantity' => (float) $sale->quantity_kg,
                'is_credit' => $sale->is_credit,
            ]),
        ];
    }
}
