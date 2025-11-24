<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;
use App\Models\SaleItem;

final readonly class GenerateSalesByCustomerReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(string $startDate, string $endDate): array
    {
        $saleItemTotals = SaleItem::query()
            ->selectRaw('sale_id, SUM(quantity_kg) as quantity_total')
            ->groupBy('sale_id');

        $data = Sale::query()
            ->select('customers.id', 'customers.name')
            ->selectRaw('SUM(sales.total_amount) as total_revenue')
            ->selectRaw('COALESCE(SUM(sale_item_totals.quantity_total), 0) as total_quantity')
            ->selectRaw('COUNT(DISTINCT sales.id) as sale_count')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoinSub($saleItemTotals, 'sale_item_totals', 'sale_item_totals.sale_id', '=', 'sales.id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_revenue')
            ->get();

        return [
            'customers' => $data->map(fn (object $item): array => [
                'id' => isset($item->id) ? (int) $item->id : 0,
                'name' => (isset($item->name) && is_string($item->name)) ? $item->name : '',
                'total_revenue' => (isset($item->total_revenue) && is_numeric($item->total_revenue)) ? (float) $item->total_revenue : 0.0,
                'total_quantity' => (isset($item->total_quantity) && is_numeric($item->total_quantity)) ? (float) $item->total_quantity : 0.0,
                'sale_count' => (isset($item->sale_count) && is_numeric($item->sale_count)) ? (int) $item->sale_count : 0,
                'average_sale' => (isset($item->sale_count) && is_numeric($item->sale_count) && (int) $item->sale_count > 0 && isset($item->total_revenue) && is_numeric($item->total_revenue))
                    ? (float) $item->total_revenue / (int) $item->sale_count
                    : 0.0,
            ]),
            'summary' => [
                'total_customers' => $data->count(),
                'total_revenue' => $data->sum(fn (object $item): float => (isset($item->total_revenue) && is_numeric($item->total_revenue)) ? (float) $item->total_revenue : 0.0),
            ],
        ];
    }
}
