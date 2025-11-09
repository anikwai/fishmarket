<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Supplier;
use App\Support\Stock;

final readonly class GenerateStockReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $suppliers = Supplier::query()->get();
        $currentStock = Stock::current();

        return [
            'current_stock' => $currentStock,
            'by_supplier' => $suppliers->map(fn ($supplier): array => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'remaining_stock' => (float) $supplier->remaining_stock,
            ])->filter(fn ($item): bool => $item['remaining_stock'] > 0),
            'summary' => [
                'total_suppliers' => $suppliers->count(),
                'suppliers_with_stock' => $suppliers->filter(fn ($s): bool => $s->remaining_stock > 0)->count(),
            ],
        ];
    }
}
