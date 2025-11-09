<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read int $id
 * @property-read int|null $purchase_id
 * @property-read CarbonInterface $expense_date
 * @property-read 'shipping'|'ice'|'other' $type
 * @property-read string $description
 * @property-read float $amount
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Purchase|null $purchase
 */
final class Expense extends Model
{
    /**
     * @use HasFactory<ExpenseFactory>
     */
    use HasFactory;

    protected $fillable = ['purchase_id', 'expense_date', 'type', 'description', 'amount'];

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'integer',
            'purchase_id' => 'integer',
            'expense_date' => 'date',
            'type' => 'string',
            'description' => 'string',
            'amount' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }
}
