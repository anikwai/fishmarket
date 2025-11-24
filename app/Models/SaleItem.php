<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read int $id
 * @property-read int $sale_id
 * @property-read int $purchase_id
 * @property-read float $quantity_kg
 * @property-read float $price_per_kg
 * @property-read float $total_price
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Sale $sale
 * @property-read Purchase $purchase
 */
final class SaleItem extends Model
{
    /**
     * @use HasFactory<\Database\Factories\SaleItemFactory>
     */
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'purchase_id',
        'quantity_kg',
        'price_per_kg',
        'total_price',
    ];

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'integer',
            'sale_id' => 'integer',
            'purchase_id' => 'integer',
            'quantity_kg' => 'decimal:2',
            'price_per_kg' => 'decimal:2',
            'total_price' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * @return BelongsTo<Purchase, $this>
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    protected static function booted(): void
    {
        $recalculate = static function (SaleItem $item): void {
            self::refreshSaleTotals($item);
        };

        static::saved($recalculate);
        static::deleted($recalculate);
        static::forceDeleted($recalculate);
        static::restored($recalculate);
    }

    private static function refreshSaleTotals(SaleItem $saleItem): void
    {
        $sale = $saleItem->sale ?? $saleItem->sale()->first();

        if (! $sale instanceof Sale) {
            return;
        }

        $subtotal = (float) $sale->items()->sum('total_price');

        $sale->forceFill([
            'subtotal' => $subtotal,
            'total_amount' => $subtotal + (float) $sale->delivery_fee,
        ])->saveQuietly();
    }
}
