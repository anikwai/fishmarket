<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Customer;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update sales') ?? false;
    }

    /**
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        $sale = $this->route('sale');

        $itemIdRule = ['sometimes', 'integer'];

        if ($sale instanceof Sale) {
            $itemIdRule[] = Rule::exists('sale_items', 'id')->where(
                fn (\Illuminate\Database\Query\Builder $query): \Illuminate\Database\Query\Builder => $query->where('sale_id', $sale->id),
            );
        }

        return [
            'customer_id' => ['required', Rule::exists(Customer::class, 'id')],
            'sale_date' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => $itemIdRule,
            'items.*.purchase_id' => ['required', Rule::exists('purchases', 'id')],
            'items.*.quantity_kg' => ['required', 'numeric', 'min:0.01'],
            'items.*.price_per_kg' => ['required', 'numeric', 'min:0'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'is_credit' => ['nullable', 'boolean'],
            'is_delivery' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function () use ($validator): void {
            /** @var Sale|null $sale */
            $sale = $this->route('sale');
            $items = $this->input('items', []);

            if (! $sale instanceof Sale || ! is_array($items)) {
                return;
            }

            /** @var \Illuminate\Support\Collection<string, float> $requestedByPurchase */
            $requestedByPurchase = collect($items)
                ->filter(fn (mixed $item): bool => is_array($item) && isset($item['purchase_id']) && is_scalar($item['purchase_id']))
                ->groupBy(fn (array $item): string => (string) $item['purchase_id'])
                ->map(fn (\Illuminate\Support\Collection $group): float => $group->sum(function (array $item): float {
                    $quantity = $item['quantity_kg'] ?? null;

                    return is_numeric($quantity) ? (float) $quantity : 0.0;
                }));

            if ($requestedByPurchase->isEmpty()) {
                return;
            }

            $currentByPurchase = $sale->items()
                ->selectRaw('purchase_id, SUM(quantity_kg) as total_quantity')
                ->groupBy('purchase_id')
                ->pluck('total_quantity', 'purchase_id')
                ->map(fn (mixed $quantity): float => is_numeric($quantity) ? (float) $quantity : 0.0);

            $purchases = Purchase::query()
                ->whereIn('id', $requestedByPurchase->keys()->map(fn (string $key): int => (int) $key)->all())
                ->get()
                ->keyBy('id');

            foreach ($requestedByPurchase as $purchaseId => $requestedQuantity) {
                /** @var Purchase|null $purchase */
                $purchase = $purchases->get((int) $purchaseId);

                if (! $purchase instanceof Purchase) {
                    continue;
                }

                $currentQuantity = $currentByPurchase->get((int) $purchaseId, 0.0);
                $available = (float) $purchase->remaining_quantity + $currentQuantity;

                if ($requestedQuantity > $available) {
                    $validator->errors()->add(
                        'items',
                        "Total requested quantity for purchase {$purchase->id} exceeds available stock ({$available} kg).",
                    );
                }
            }
        });
    }
}
