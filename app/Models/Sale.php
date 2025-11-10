<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\SaleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property-read int $id
 * @property-read int $customer_id
 * @property-read CarbonInterface $sale_date
 * @property-read float $quantity_kg
 * @property-read float $price_per_kg
 * @property-read float $discount_percentage
 * @property float $subtotal
 * @property-read float $delivery_fee
 * @property float $total_amount
 * @property-read bool $is_credit
 * @property-read bool $is_delivery
 * @property-read string|null $notes
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Customer $customer
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Payment> $payments
 */
final class Sale extends Model
{
    /**
     * @use HasFactory<SaleFactory>
     */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'integer',
            'customer_id' => 'integer',
            'sale_date' => 'date',
            'quantity_kg' => 'decimal:2',
            'price_per_kg' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'is_credit' => 'boolean',
            'is_delivery' => 'boolean',
            'notes' => 'string',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return BelongsToMany<Purchase, $this>
     */
    public function purchases(): BelongsToMany
    {
        return $this->belongsToMany(Purchase::class, 'purchase_sale')
            ->withPivot('quantity_kg')
            ->withTimestamps();
    }

    /**
     * @return HasMany<Receipt, $this>
     */
    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    /**
     * @return HasOne<Receipt, $this>
     */
    public function activeReceipt(): HasOne
    {
        return $this->hasOne(Receipt::class)->where('status', 'active')->latestOfMany();
    }

    protected static function booted(): void
    {
        self::saving(function (Sale $sale): void {
            if ($sale->isDirty(['quantity_kg', 'price_per_kg', 'discount_percentage', 'delivery_fee'])) {
                $sale->subtotal = $sale->quantity_kg * $sale->price_per_kg * (1 - ($sale->discount_percentage / 100));
                $sale->total_amount = $sale->subtotal + $sale->delivery_fee;
            }
        });
    }

    protected function getProfitAttribute(): float
    {
        return $this->purchases()
            ->get()
            ->sum(function (Purchase $purchase): float {
                /** @var \Illuminate\Database\Eloquent\Relations\Pivot|null $pivot */
                $pivot = $purchase->pivot ?? null;
                $quantityFromThisPurchase = ($pivot !== null && property_exists($pivot, 'quantity_kg') && is_numeric($pivot->quantity_kg)) ? (float) $pivot->quantity_kg : 0.0;
                if ($quantityFromThisPurchase <= 0) {
                    return 0.0;
                }
                $revenuePerKg = (float) $this->price_per_kg * (1 - ((float) $this->discount_percentage / 100));

                return ($revenuePerKg - (float) $purchase->price_per_kg) * $quantityFromThisPurchase;
            });
    }

    protected function getOutstandingBalanceAttribute(): float
    {
        if (! $this->is_credit) {
            return 0.0;
        }

        $paidAmount = $this->payments()->sum('amount');

        return max(0.0, $this->total_amount - (float) $paidAmount);
    }
}
