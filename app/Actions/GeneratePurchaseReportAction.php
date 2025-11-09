<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;

final readonly class GeneratePurchaseReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(string $startDate, string $endDate, ?string $supplierId = null): array
    {
        $query = Purchase::query()
            ->whereBetween('purchase_date', [$startDate, $endDate])
            ->with('supplier');

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        $purchases = $query->get();

        $bySupplier = Purchase::query()
            ->select('suppliers.id', 'suppliers.name')
            ->selectRaw('SUM(purchases.total_cost) as total_cost')
            ->selectRaw('SUM(purchases.quantity_kg) as total_quantity')
            ->selectRaw('COUNT(purchases.id) as purchase_count')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereBetween('purchases.purchase_date', [$startDate, $endDate])
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total_cost')
            ->get();

        return [
            'purchases' => $purchases->map(fn ($purchase): array => [
                'id' => $purchase->id,
                'date' => $purchase->purchase_date->format('Y-m-d'),
                'supplier' => $purchase->supplier->name,
                'quantity' => $purchase->quantity_kg,
                'price_per_kg' => $purchase->price_per_kg,
                'total_cost' => $purchase->total_cost,
            ]),
            'by_supplier' => $bySupplier->map(fn ($item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'total_cost' => (float) $item->total_cost,
                'total_quantity' => (float) $item->total_quantity,
                'purchase_count' => (int) $item->purchase_count,
                'average_price' => (float) $item->total_quantity > 0
                    ? (float) $item->total_cost / (float) $item->total_quantity
                    : 0,
            ]),
            'summary' => [
                'total_cost' => $purchases->sum('total_cost'),
                'total_quantity' => $purchases->sum('quantity_kg'),
                'count' => $purchases->count(),
                'average_price_per_kg' => $purchases->sum('quantity_kg') > 0
                    ? $purchases->sum('total_cost') / $purchases->sum('quantity_kg')
                    : 0,
            ],
        ];
    }
}
