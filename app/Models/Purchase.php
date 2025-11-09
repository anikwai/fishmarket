<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\PurchaseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read int $id
 * @property-read int $supplier_id
 * @property-read CarbonInterface $purchase_date
 * @property-read float $quantity_kg
 * @property-read float $price_per_kg
 * @property-read float $total_cost
 * @property-read string|null $notes
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Supplier $supplier
 */
final class Purchase extends Model
{
    /**
     * @use HasFactory<PurchaseFactory>
     */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'integer',
            'supplier_id' => 'integer',
            'purchase_date' => 'date',
            'quantity_kg' => 'decimal:2',
            'price_per_kg' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'notes' => 'string',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function sales(): BelongsToMany
    {
        return $this->belongsToMany(Sale::class, 'purchase_sale')
            ->withPivot('quantity_kg')
            ->withTimestamps();
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    protected static function booted(): void
    {
        self::saving(function (Purchase $purchase): void {
            if ($purchase->isDirty(['quantity_kg', 'price_per_kg'])) {
                $purchase->total_cost = $purchase->quantity_kg * $purchase->price_per_kg;
            }
        });
    }

    protected function getTotalExpensesAttribute(): float
    {
        return (float) $this->expenses()->sum('amount');
    }

    protected function getProfitAttribute(): float
    {
        // Use already loaded relationship if available, otherwise query with pivot
        $sales = $this->relationLoaded('sales')
            ? $this->sales
            : $this->sales()->withPivot('quantity_kg')->get();

        $revenue = $sales->sum(function (Sale $sale): float {
            // Calculate revenue from this purchase: (sale price per kg - purchase price per kg) * quantity from this purchase
            $quantityFromThisPurchase = (float) ($sale->pivot->quantity_kg ?? 0);
            if ($quantityFromThisPurchase <= 0) {
                return 0.0;
            }
            $revenuePerKg = (float) $sale->price_per_kg * (1 - ((float) $sale->discount_percentage / 100));

            return ($revenuePerKg - (float) $this->price_per_kg) * $quantityFromThisPurchase;
        });

        // Subtract expenses tied to this purchase
        $expenses = $this->relationLoaded('expenses')
            ? $this->expenses->sum('amount')
            : $this->expenses()->sum('amount');

        return $revenue - (float) $expenses;
    }

    protected function getTotalRevenueAttribute(): float
    {
        // Use already loaded relationship if available, otherwise query with pivot
        $sales = $this->relationLoaded('sales')
            ? $this->sales
            : $this->sales()->withPivot('quantity_kg')->get();

        return $sales->sum(function (Sale $sale): float {
            $quantityFromThisPurchase = (float) ($sale->pivot->quantity_kg ?? 0);
            if ($quantityFromThisPurchase <= 0) {
                return 0.0;
            }
            $revenuePerKg = (float) $sale->price_per_kg * (1 - ((float) $sale->discount_percentage / 100));

            return $revenuePerKg * $quantityFromThisPurchase;
        });
    }

    protected function getSoldQuantityAttribute(): float
    {
        return (float) $this->sales()->sum('purchase_sale.quantity_kg');
    }

    protected function getRemainingQuantityAttribute(): float
    {
        return $this->quantity_kg - $this->sold_quantity;
    }
}
