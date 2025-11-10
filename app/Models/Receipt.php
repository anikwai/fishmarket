<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\ReceiptFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read int $id
 * @property-read string $receipt_number
 * @property-read int $sale_id
 * @property-read string $status
 * @property-read int|null $reissued_from_id
 * @property-read CarbonInterface $issued_at
 * @property-read CarbonInterface|null $voided_at
 * @property-read string|null $void_reason
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Sale $sale
 * @property-read Receipt|null $reissuedFrom
 */
final class Receipt extends Model
{
    /**
     * @use HasFactory<ReceiptFactory>
     */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'integer',
            'receipt_number' => 'string',
            'sale_id' => 'integer',
            'status' => 'string',
            'reissued_from_id' => 'integer',
            'issued_at' => 'datetime',
            'voided_at' => 'datetime',
            'void_reason' => 'string',
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
     * @return BelongsTo<Receipt, $this>
     */
    public function reissuedFrom(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reissued_from_id');
    }

    public function isVoid(): bool
    {
        return $this->status === 'void';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isReissued(): bool
    {
        return $this->status === 'reissued';
    }
}
