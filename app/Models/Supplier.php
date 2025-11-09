<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\SupplierFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string|null $email
 * @property-read string|null $phone
 * @property-read string|null $address
 * @property-read string|null $notes
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Purchase> $purchases
 */
final class Supplier extends Model
{
    /**
     * @use HasFactory<SupplierFactory>
     */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'integer',
            'name' => 'string',
            'email' => 'string',
            'phone' => 'string',
            'address' => 'string',
            'notes' => 'string',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Calculate the total remaining stock from this supplier.
     * This sums up the remaining quantity from all purchases made from this supplier.
     */
    protected function getRemainingStockAttribute(): float
    {
        // Get all purchases from this supplier with their sold quantities
        $purchases = $this->purchases()
            ->select('purchases.*')
            ->selectRaw('COALESCE(SUM(purchase_sale.quantity_kg), 0) as sold_quantity')
            ->leftJoin('purchase_sale', 'purchases.id', '=', 'purchase_sale.purchase_id')
            ->groupBy('purchases.id', 'purchases.supplier_id', 'purchases.purchase_date', 'purchases.quantity_kg', 'purchases.price_per_kg', 'purchases.total_cost', 'purchases.notes', 'purchases.created_at', 'purchases.updated_at')
            ->get();

        return $purchases->sum(function ($purchase): float|int {
            $soldQuantity = (float) ($purchase->sold_quantity ?? 0);

            return max(0, (float) $purchase->quantity_kg - $soldQuantity);
        });
    }
}
