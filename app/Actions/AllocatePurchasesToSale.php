<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final readonly class AllocatePurchasesToSale
{
    /**
     * Allocate purchases to a sale using FIFO (First In First Out) method.
     * This tracks which purchases contributed to which sale for profit calculation.
     */
    public function handle(Sale $sale, float $quantityKg): void
    {
        // Get all purchases with remaining stock, ordered by purchase date (FIFO)
        $purchases = Purchase::query()
            ->select('purchases.*')
            ->selectRaw('COALESCE(SUM(purchase_sale.quantity_kg), 0) as allocated_quantity')
            ->leftJoin('purchase_sale', 'purchases.id', '=', 'purchase_sale.purchase_id')
            ->groupBy('purchases.id', 'purchases.supplier_id', 'purchases.purchase_date', 'purchases.quantity_kg', 'purchases.price_per_kg', 'purchases.total_cost', 'purchases.notes', 'purchases.created_at', 'purchases.updated_at')
            ->havingRaw('purchases.quantity_kg > COALESCE(SUM(purchase_sale.quantity_kg), 0)')
            ->oldest('purchases.purchase_date')
            ->orderBy('purchases.id')
            ->get();

        $remainingQuantity = $quantityKg;

        foreach ($purchases as $purchase) {
            if ($remainingQuantity <= 0) {
                break;
            }

            $allocatedQuantity = (float) ($purchase->allocated_quantity ?? 0);
            $availableQuantity = $purchase->quantity_kg - $allocatedQuantity;
            $quantityToAllocate = min($remainingQuantity, $availableQuantity);

            if ($quantityToAllocate > 0) {
                $sale->purchases()->attach($purchase->id, [
                    'quantity_kg' => $quantityToAllocate,
                ]);

                $remainingQuantity -= $quantityToAllocate;
            }
        }

        if ($remainingQuantity > 0) {
            throw new RuntimeException('Insufficient stock to allocate. Remaining: '.number_format($remainingQuantity, 2).' kg');
        }
    }

    /**
     * Reallocate purchases for a sale (used when updating sale quantity).
     */
    public function reallocate(Sale $sale, float $newQuantityKg): void
    {
        DB::transaction(function () use ($sale, $newQuantityKg): void {
            // Remove existing allocations
            $sale->purchases()->detach();

            // Allocate with new quantity
            $this->handle($sale, $newQuantityKg);
        });
    }
}
