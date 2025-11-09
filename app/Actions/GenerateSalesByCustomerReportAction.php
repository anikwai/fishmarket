<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;

final readonly class GenerateSalesByCustomerReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(string $startDate, string $endDate): array
    {
        $data = Sale::query()
            ->select('customers.id', 'customers.name')
            ->selectRaw('SUM(sales.total_amount) as total_revenue')
            ->selectRaw('SUM(sales.quantity_kg) as total_quantity')
            ->selectRaw('COUNT(sales.id) as sale_count')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_revenue')
            ->get();

        return [
            'customers' => $data->map(fn ($item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'total_revenue' => (float) $item->total_revenue,
                'total_quantity' => (float) $item->total_quantity,
                'sale_count' => (int) $item->sale_count,
                'average_sale' => (int) $item->sale_count > 0
                    ? (float) $item->total_revenue / (int) $item->sale_count
                    : 0,
            ]),
            'summary' => [
                'total_customers' => $data->count(),
                'total_revenue' => $data->sum('total_revenue'),
            ],
        ];
    }
}
