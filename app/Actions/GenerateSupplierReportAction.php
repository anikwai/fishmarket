<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Supplier;

final readonly class GenerateSupplierReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?string $supplierId = null): array
    {
        if (! $supplierId) {
            return [
                'suppliers' => Supplier::query()
                    ->withCount('purchases')
                    ->withSum('purchases', 'total_cost')
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($supplier) => [
                        'id' => $supplier->id,
                        'name' => $supplier->name,
                        'email' => $supplier->email,
                        'phone' => $supplier->phone,
                        'total_purchases' => (int) $supplier->purchases_count,
                        'total_cost' => (float) $supplier->purchases_sum_total_cost,
                        'remaining_stock' => (float) $supplier->remaining_stock,
                    ]),
            ];
        }

        $supplier = Supplier::query()
            ->with(['purchases' => fn ($q) => $q->orderByDesc('purchase_date')->limit(20)])
            ->findOrFail($supplierId);

        return [
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'email' => $supplier->email,
                'phone' => $supplier->phone,
                'address' => $supplier->address,
            ],
            'summary' => [
                'total_purchases' => $supplier->purchases()->count(),
                'total_cost' => $supplier->purchases()->sum('total_cost'),
                'total_quantity' => $supplier->purchases()->sum('quantity_kg'),
                'remaining_stock' => (float) $supplier->remaining_stock,
                'average_price_per_kg' => $supplier->purchases()->sum('quantity_kg') > 0
                    ? $supplier->purchases()->sum('total_cost') / $supplier->purchases()->sum('quantity_kg')
                    : 0,
            ],
            'recent_purchases' => $supplier->purchases->map(fn ($purchase) => [
                'id' => $purchase->id,
                'date' => $purchase->purchase_date->format('Y-m-d'),
                'quantity' => $purchase->quantity_kg,
                'price_per_kg' => $purchase->price_per_kg,
                'total_cost' => $purchase->total_cost,
            ]),
        ];
    }
}
