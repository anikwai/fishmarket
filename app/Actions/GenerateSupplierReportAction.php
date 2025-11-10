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
                    ->map(fn (Supplier $supplier): array => [
                        'id' => $supplier->id,
                        'name' => $supplier->name,
                        'email' => $supplier->email,
                        'phone' => $supplier->phone,
                        'total_purchases' => isset($supplier->purchases_count) ? (int) $supplier->purchases_count : 0,
                        'total_cost' => (isset($supplier->purchases_sum_total_cost) && is_numeric($supplier->purchases_sum_total_cost)) ? (float) $supplier->purchases_sum_total_cost : 0.0,
                        'remaining_stock' => (float) $supplier->remaining_stock,
                    ]),
            ];
        }

        $supplier = Supplier::query()
            /** @phpstan-ignore-next-line */
            ->with(['purchases' => function (\Illuminate\Database\Eloquent\Relations\HasMany $q): void {
                $q->latest('purchase_date')->limit(20);
            }])
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
                'total_cost' => (float) $supplier->purchases()->sum('total_cost'),
                'total_quantity' => (float) $supplier->purchases()->sum('quantity_kg'),
                'remaining_stock' => (float) $supplier->remaining_stock,
                'average_price_per_kg' => ($supplier->purchases()->sum('quantity_kg') > 0)
                    ? (float) $supplier->purchases()->sum('total_cost') / (float) $supplier->purchases()->sum('quantity_kg')
                    : 0.0,
            ],
            'recent_purchases' => $supplier->purchases->map(fn (\App\Models\Purchase $purchase): array => [
                'id' => $purchase->id,
                'date' => $purchase->purchase_date->format('Y-m-d'),
                'quantity' => (float) $purchase->quantity_kg,
                'price_per_kg' => (float) $purchase->price_per_kg,
                'total_cost' => (float) $purchase->total_cost,
            ]),
        ];
    }
}
