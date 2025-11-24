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
 * @property float $total_cost
 * @property-read string|null $notes
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Supplier $supplier
 * @property-read float $profit
 * @property-read float $total_revenue
 * @property-read float $sold_quantity
 * @property-read float $remaining_quantity
 */
final class Purchase extends Model
{
    /**
     * @use HasFactory<PurchaseFactory>
     */
    use HasFactory;

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['profit', 'total_revenue', 'invoice_number'];

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

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsToMany<Sale, $this>
     */
    /**
     * @return HasMany<SaleItem, $this>
     */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * @return BelongsToMany<Sale, $this>
     */
    public function sales(): BelongsToMany
    {
        return $this->belongsToMany(Sale::class, 'sale_items')
            ->withPivot(['quantity_kg', 'price_per_kg', 'total_price'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<Expense, $this>
     */
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

    protected function getInvoiceNumberAttribute(): string
    {
        return 'INV-'.mb_str_pad((string) $this->id, 6, '0', STR_PAD_LEFT);
    }

    protected function getTotalExpensesAttribute(): float
    {
        return (float) $this->expenses()->sum('amount');
    }

    protected function getProfitAttribute(): float
    {
        $revenue = $this->saleItems->sum(fn (SaleItem $item): float => $item->total_price - ($item->quantity_kg * $this->price_per_kg));

        // Subtract expenses tied to this purchase
        $expenses = $this->relationLoaded('expenses')
            ? (float) $this->expenses->sum('amount') // @phpstan-ignore cast.double
            : (float) $this->expenses()->sum('amount');

        return $revenue - $expenses;
    }

    protected function getTotalRevenueAttribute(): float
    {
        return (float) $this->saleItems()->sum('total_price');
    }

    protected function getSoldQuantityAttribute(): float
    {
        return (float) $this->saleItems()->sum('quantity_kg');
    }

    protected function getRemainingQuantityAttribute(): float
    {
        return $this->quantity_kg - $this->sold_quantity;
    }
}
