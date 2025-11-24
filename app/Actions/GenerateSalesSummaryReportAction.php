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

        /** @var \Illuminate\Database\Eloquent\Collection<int, Sale> $sales */
        $sales = $query->with(['customer', 'items'])->get();

        $dailyData = Sale::query()
            ->selectRaw('sales.sale_date::date as date')
            ->selectRaw('SUM(sales.total_amount) as revenue')
            ->selectRaw('SUM(sale_items.quantity_kg) as quantity')
            ->selectRaw('COUNT(DISTINCT sales.id) as count')
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->when($customerId, fn (\Illuminate\Database\Eloquent\Builder $q) => $q->where('sales.customer_id', $customerId))
            ->groupByRaw('sales.sale_date::date')
            ->orderBy('date')
            ->get();

        /** @var float $totalRevenue */
        $totalRevenue = $sales->sum(fn (Sale $sale): float => (float) $sale->total_amount);
        /** @var float $totalQuantity */
        $totalQuantity = $sales->sum(fn (Sale $sale): float => (float) $sale->items->sum(fn (\App\Models\SaleItem $item): float => (float) $item->quantity_kg));
        /** @var float $creditSales */
        $creditSales = $sales->where('is_credit', true)->sum(fn (Sale $sale): float => (float) $sale->total_amount);
        /** @var float $cashSales */
        $cashSales = $sales->where('is_credit', false)->sum(fn (Sale $sale): float => (float) $sale->total_amount);

        return [
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'total_quantity' => (float) $totalQuantity,
                'total_sales' => $sales->count(),
                'average_sale' => $sales->count() > 0 ? $totalRevenue / $sales->count() : 0.0,
                'credit_sales' => (float) $creditSales,
                'cash_sales' => (float) $cashSales,
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
                'quantity' => (float) $sale->items->sum(fn (\App\Models\SaleItem $item): float => (float) $item->quantity_kg),
                'is_credit' => $sale->is_credit,
            ]),
        ];
    }
}
