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
            'purchases' => $purchases->map(fn (Purchase $purchase): array => [
                'id' => $purchase->id,
                'date' => $purchase->purchase_date->format('Y-m-d'),
                'supplier' => $purchase->supplier->name,
                'quantity' => (float) $purchase->quantity_kg,
                'price_per_kg' => (float) $purchase->price_per_kg,
                'total_cost' => (float) $purchase->total_cost,
            ]),
            'by_supplier' => $bySupplier->map(fn (object $item): array => [
                'id' => isset($item->id) ? (int) $item->id : 0,
                'name' => (isset($item->name) && is_string($item->name)) ? $item->name : '',
                'total_cost' => is_numeric($item->total_cost ?? null) ? (float) $item->total_cost : 0.0,
                'total_quantity' => is_numeric($item->total_quantity ?? null) ? (float) $item->total_quantity : 0.0,
                'purchase_count' => is_numeric($item->purchase_count ?? null) ? (int) $item->purchase_count : 0,
                'average_price' => (is_numeric($item->total_quantity ?? null) && (float) $item->total_quantity > 0 && is_numeric($item->total_cost ?? null))
                    ? (float) $item->total_cost / (float) $item->total_quantity
                    : 0.0,
            ]),
            'summary' => [
                'total_cost' => $purchases->sum(fn (Purchase $p): float => (float) $p->total_cost),
                'total_quantity' => $purchases->sum(fn (Purchase $p): float => (float) $p->quantity_kg),
                'count' => $purchases->count(),
                'average_price_per_kg' => ($purchases->sum(fn (Purchase $p): float => (float) $p->quantity_kg) > 0)
                    ? $purchases->sum(fn (Purchase $p): float => (float) $p->total_cost) / $purchases->sum(fn (Purchase $p): float => (float) $p->quantity_kg)
                    : 0.0,
            ],
        ];
    }
}
