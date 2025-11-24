<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\SaleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property-read int $id
 * @property-read int $customer_id
 * @property-read CarbonInterface $sale_date
 * @property float $subtotal
 * @property-read float $delivery_fee
 * @property float $total_amount
 * @property-read bool $is_credit
 * @property-read bool $is_delivery
 * @property-read string|null $notes
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read float $outstanding_balance
 * @property-read bool $is_fully_paid
 * @property-read Customer $customer
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Payment> $payments
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SaleItem> $items
 */
final class Sale extends Model
{
    /**
     * @use HasFactory<SaleFactory>
     */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['quantity_kg', 'is_fully_paid'];

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'integer',
            'customer_id' => 'integer',
            'sale_date' => 'date',
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
     * @return HasMany<SaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
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
            if ($sale->isDirty(['subtotal', 'delivery_fee'])) {
                $sale->total_amount = $sale->subtotal + $sale->delivery_fee;
            }
        });
    }

    protected function getQuantityKgAttribute(): float
    {
        return (float) $this->items->sum(fn (SaleItem $item): float => (float) $item->quantity_kg);
    }

    protected function getProfitAttribute(): float
    {
        return $this->items()
            ->get()
            ->sum(function (SaleItem $item): float {
                $purchasePrice = $item->purchase->price_per_kg;

                return ($item->price_per_kg - $purchasePrice) * $item->quantity_kg;
            });
    }

    protected function getOutstandingBalanceAttribute(): float
    {
        if (! $this->is_credit) {
            return 0.0;
        }

        // Use loaded relationship if available to avoid N+1
        $paidAmount = $this->relationLoaded('payments') ? $this->payments->sum('amount') : $this->payments()->sum('amount');

        return max(0.0, $this->total_amount - (is_numeric($paidAmount) ? (float) $paidAmount : 0.0));
    }

    protected function getIsFullyPaidAttribute(): bool
    {
        if (! $this->is_credit) {
            return true;
        }

        return $this->outstanding_balance <= 0.0;
    }
}
